import { Router } from "express";
import { db } from "@workspace/db";
import {
  recitationsTable,
  studentsTable,
  circlesTable,
  usersTable,
} from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";

const router = Router();

async function formatRecitation(r: typeof recitationsTable.$inferSelect) {
  const [student] = await db
    .select({
      name: studentsTable.name,
      circleId: studentsTable.circleId,
      afternoonTeacherId: studentsTable.afternoonTeacherId,
    })
    .from(studentsTable)
    .where(eq(studentsTable.id, r.studentId))
    .limit(1);

  const circleId = r.circleId ?? student?.circleId;
  const circle = circleId
    ? await db
        .select({ name: circlesTable.name, teacherId: circlesTable.teacherId })
        .from(circlesTable)
        .where(eq(circlesTable.id, circleId))
        .limit(1)
    : [];

  let morningTeacherName: string | null = null;
  if (circle[0]?.teacherId) {
    const [mt] = await db
      .select({ name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, circle[0].teacherId))
      .limit(1);
    morningTeacherName = mt?.name ?? null;
  }

  return {
    id: r.id,
    studentId: r.studentId,
    studentName: student?.name ?? "غير معروف",
    circleId: circleId ?? null,
    circleName: circle[0]?.name ?? null,
    morningTeacherName,
    afternoonTeacherId: student?.afternoonTeacherId ?? null,
    date: r.date,
    fromSurah: r.fromSurah,
    toSurah: r.toSurah,
    fromVerse: r.fromVerse,
    toVerse: r.toVerse,
    grade: r.grade,
    notes: r.notes,
  };
}

router.get("/recitations", async (req, res) => {
  const { studentId, circleId, date, fromDate, toDate, afternoonTeacherId } =
    req.query;

  let baseQuery = db
    .select({ r: recitationsTable, s: studentsTable })
    .from(recitationsTable)
    .leftJoin(studentsTable, eq(recitationsTable.studentId, studentsTable.id));

  const conditions: ReturnType<typeof eq>[] = [];
  if (studentId) conditions.push(eq(recitationsTable.studentId, parseInt(studentId as string)));
  if (circleId) conditions.push(eq(recitationsTable.circleId, parseInt(circleId as string)));
  if (date) conditions.push(eq(recitationsTable.date, date as string));
  if (fromDate) conditions.push(gte(recitationsTable.date, fromDate as string));
  if (toDate) conditions.push(lte(recitationsTable.date, toDate as string));
  if (afternoonTeacherId)
    conditions.push(
      eq(studentsTable.afternoonTeacherId, parseInt(afternoonTeacherId as string))
    );

  let rows;
  if (conditions.length > 0) {
    rows = await baseQuery.where(and(...conditions)).orderBy(recitationsTable.date);
  } else {
    rows = await baseQuery.orderBy(recitationsTable.date);
  }

  const result = await Promise.all(rows.map(({ r }) => formatRecitation(r)));
  res.json(result);
});

router.post("/recitations", async (req, res) => {
  const { studentId, date, fromSurah, toSurah, fromVerse, toVerse, grade, notes } =
    req.body;
  if (!studentId || !date || !fromSurah || !toSurah) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  // Get student's circle
  const [student] = await db
    .select({ circleId: studentsTable.circleId })
    .from(studentsTable)
    .where(eq(studentsTable.id, studentId))
    .limit(1);

  const [recitation] = await db
    .insert(recitationsTable)
    .values({
      studentId,
      circleId: student?.circleId ?? null,
      date,
      fromSurah,
      toSurah,
      fromVerse: fromVerse ?? null,
      toVerse: toVerse ?? null,
      grade: grade ?? null,
      notes: notes ?? null,
    })
    .returning();

  res.status(201).json(await formatRecitation(recitation));
});

router.patch("/recitations/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { fromSurah, toSurah, fromVerse, toVerse, grade, notes } = req.body;

  const updateData: Record<string, unknown> = {};
  if (fromSurah !== undefined) updateData.fromSurah = fromSurah;
  if (toSurah !== undefined) updateData.toSurah = toSurah;
  if (fromVerse !== undefined) updateData.fromVerse = fromVerse;
  if (toVerse !== undefined) updateData.toVerse = toVerse;
  if (grade !== undefined) updateData.grade = grade;
  if (notes !== undefined) updateData.notes = notes;

  const [recitation] = await db
    .update(recitationsTable)
    .set(updateData)
    .where(eq(recitationsTable.id, id))
    .returning();

  if (!recitation) {
    res.status(404).json({ error: "Recitation not found" });
    return;
  }

  res.json(await formatRecitation(recitation));
});

router.delete("/recitations/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(recitationsTable).where(eq(recitationsTable.id, id));
  res.status(204).send();
});

export default router;
