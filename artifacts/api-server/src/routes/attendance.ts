import { Router } from "express";
import { db } from "@workspace/db";
import { attendanceTable, studentsTable, circlesTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";

const router = Router();

async function formatAttendance(record: typeof attendanceTable.$inferSelect) {
  const [student] = await db
    .select({ name: studentsTable.name })
    .from(studentsTable)
    .where(eq(studentsTable.id, record.studentId))
    .limit(1);

  const circle = record.circleId
    ? await db
        .select({ name: circlesTable.name })
        .from(circlesTable)
        .where(eq(circlesTable.id, record.circleId))
        .limit(1)
    : [];

  return {
    id: record.id,
    studentId: record.studentId,
    studentName: student?.name ?? "غير معروف",
    circleId: record.circleId,
    circleName: circle[0]?.name ?? null,
    date: record.date,
    status: record.status,
    notes: record.notes,
  };
}

router.get("/attendance", async (req, res) => {
  const { circleId, studentId, date, fromDate, toDate } = req.query;

  const conditions: ReturnType<typeof eq>[] = [];
  if (circleId) conditions.push(eq(attendanceTable.circleId, parseInt(circleId as string)));
  if (studentId) conditions.push(eq(attendanceTable.studentId, parseInt(studentId as string)));
  if (date) conditions.push(eq(attendanceTable.date, date as string));
  if (fromDate) conditions.push(gte(attendanceTable.date, fromDate as string));
  if (toDate) conditions.push(lte(attendanceTable.date, toDate as string));

  let rows;
  if (conditions.length > 0) {
    rows = await db
      .select()
      .from(attendanceTable)
      .where(and(...conditions))
      .orderBy(attendanceTable.date);
  } else {
    rows = await db.select().from(attendanceTable).orderBy(attendanceTable.date);
  }

  // Batch load student and circle names
  const studentIds = [...new Set(rows.map((r) => r.studentId))];
  const circleIds = [...new Set(rows.map((r) => r.circleId).filter(Boolean) as number[])];

  const students: Record<number, string> = {};
  for (const sid of studentIds) {
    const [s] = await db.select({ name: studentsTable.name }).from(studentsTable).where(eq(studentsTable.id, sid)).limit(1);
    if (s) students[sid] = s.name;
  }

  const circles: Record<number, string> = {};
  for (const cid of circleIds) {
    const [c] = await db.select({ name: circlesTable.name }).from(circlesTable).where(eq(circlesTable.id, cid)).limit(1);
    if (c) circles[cid] = c.name;
  }

  res.json(
    rows.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      studentName: students[r.studentId] ?? "غير معروف",
      circleId: r.circleId,
      circleName: r.circleId ? circles[r.circleId] ?? null : null,
      date: r.date,
      status: r.status,
      notes: r.notes,
    }))
  );
});

router.post("/attendance", async (req, res) => {
  const { date, circleId, records } = req.body;
  if (!date || !records || !Array.isArray(records)) {
    res.status(400).json({ error: "date and records required" });
    return;
  }

  const inserted = await Promise.all(
    records.map(async (record: { studentId: number; status: string; notes?: string }) => {
      // Upsert: delete existing then insert
      await db
        .delete(attendanceTable)
        .where(
          and(
            eq(attendanceTable.studentId, record.studentId),
            eq(attendanceTable.date, date)
          )
        );

      const [att] = await db
        .insert(attendanceTable)
        .values({
          studentId: record.studentId,
          circleId: circleId ?? null,
          date,
          status: record.status as "present" | "absent" | "excused",
          notes: record.notes ?? null,
        })
        .returning();

      return att;
    })
  );

  const circle = circleId
    ? await db.select({ name: circlesTable.name }).from(circlesTable).where(eq(circlesTable.id, circleId)).limit(1)
    : [];

  const studentIds = inserted.map((r) => r.studentId);
  const students: Record<number, string> = {};
  for (const sid of studentIds) {
    const [s] = await db.select({ name: studentsTable.name }).from(studentsTable).where(eq(studentsTable.id, sid)).limit(1);
    if (s) students[sid] = s.name;
  }

  res.status(201).json(
    inserted.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      studentName: students[r.studentId] ?? "غير معروف",
      circleId: r.circleId,
      circleName: circle[0]?.name ?? null,
      date: r.date,
      status: r.status,
      notes: r.notes,
    }))
  );
});

router.patch("/attendance/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { status, notes } = req.body;

  const updateData: Record<string, unknown> = {};
  if (status !== undefined) updateData.status = status;
  if (notes !== undefined) updateData.notes = notes;

  const [record] = await db
    .update(attendanceTable)
    .set(updateData)
    .where(eq(attendanceTable.id, id))
    .returning();

  if (!record) {
    res.status(404).json({ error: "Attendance record not found" });
    return;
  }

  res.json(await formatAttendance(record));
});

export default router;
