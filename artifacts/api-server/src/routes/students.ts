import { Router } from "express";
import { db } from "@workspace/db";
import { studentsTable, circlesTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

async function studentWithDetails(studentId: number) {
  const rows = await db
    .select({
      student: studentsTable,
      circle: circlesTable,
      afternoonTeacher: usersTable,
    })
    .from(studentsTable)
    .leftJoin(circlesTable, eq(studentsTable.circleId, circlesTable.id))
    .leftJoin(usersTable, eq(studentsTable.afternoonTeacherId, usersTable.id))
    .where(eq(studentsTable.id, studentId))
    .limit(1);

  if (!rows.length) return null;

  const { student, circle, afternoonTeacher } = rows[0];

  // Get morning teacher from circle
  let morningTeacherName: string | null = null;
  if (circle?.teacherId) {
    const [mt] = await db
      .select({ name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, circle.teacherId))
      .limit(1);
    morningTeacherName = mt?.name ?? null;
  }

  return {
    id: student.id,
    name: student.name,
    circleId: student.circleId,
    circleName: circle?.name ?? null,
    afternoonTeacherId: student.afternoonTeacherId,
    afternoonTeacherName: afternoonTeacher?.name ?? null,
    morningTeacherName,
    phone: student.phone,
    createdAt: student.createdAt,
  };
}

router.get("/students", async (req, res) => {
  const { circleId, afternoonTeacherId } = req.query;

  let query = db
    .select({
      student: studentsTable,
      circle: circlesTable,
      afternoonTeacher: usersTable,
    })
    .from(studentsTable)
    .leftJoin(circlesTable, eq(studentsTable.circleId, circlesTable.id))
    .leftJoin(usersTable, eq(studentsTable.afternoonTeacherId, usersTable.id));

  const conditions = [];
  if (circleId) conditions.push(eq(studentsTable.circleId, parseInt(circleId as string)));
  if (afternoonTeacherId) conditions.push(eq(studentsTable.afternoonTeacherId, parseInt(afternoonTeacherId as string)));

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  const rows = await query.orderBy(studentsTable.name);

  // Get morning teachers for all circles
  const circleIds = [...new Set(rows.map((r) => r.circle?.teacherId).filter(Boolean) as number[])];
  const morningTeachers: Record<number, string> = {};
  if (circleIds.length > 0) {
    const mts = await db.select().from(usersTable).where(
      circleIds.length === 1
        ? eq(usersTable.id, circleIds[0])
        : eq(usersTable.id, circleIds[0])
    );
    for (const mt of mts) morningTeachers[mt.id] = mt.name;
  }

  res.json(
    rows.map(({ student, circle, afternoonTeacher }) => ({
      id: student.id,
      name: student.name,
      circleId: student.circleId,
      circleName: circle?.name ?? null,
      afternoonTeacherId: student.afternoonTeacherId,
      afternoonTeacherName: afternoonTeacher?.name ?? null,
      morningTeacherName: circle?.teacherId ? morningTeachers[circle.teacherId] ?? null : null,
      phone: student.phone,
      createdAt: student.createdAt,
    }))
  );
});

router.post("/students", async (req, res) => {
  const { name, circleId, afternoonTeacherId, phone } = req.body;
  if (!name) {
    res.status(400).json({ error: "Name required" });
    return;
  }

  const [student] = await db
    .insert(studentsTable)
    .values({
      name,
      circleId: circleId ?? null,
      afternoonTeacherId: afternoonTeacherId ?? null,
      phone: phone ?? null,
    })
    .returning();

  res.status(201).json(await studentWithDetails(student.id));
});

router.get("/students/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const result = await studentWithDetails(id);
  if (!result) {
    res.status(404).json({ error: "Student not found" });
    return;
  }
  res.json(result);
});

router.patch("/students/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, circleId, afternoonTeacherId, phone } = req.body;

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (circleId !== undefined) updateData.circleId = circleId;
  if (afternoonTeacherId !== undefined) updateData.afternoonTeacherId = afternoonTeacherId;
  if (phone !== undefined) updateData.phone = phone;

  const [student] = await db
    .update(studentsTable)
    .set(updateData)
    .where(eq(studentsTable.id, id))
    .returning();

  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  res.json(await studentWithDetails(student.id));
});

router.delete("/students/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(studentsTable).where(eq(studentsTable.id, id));
  res.status(204).send();
});

export default router;
