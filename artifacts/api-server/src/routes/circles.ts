import { Router } from "express";
import { db } from "@workspace/db";
import { circlesTable, usersTable, studentsTable } from "@workspace/db";
import { eq, sql, count } from "drizzle-orm";

const router = Router();

async function circleWithDetails(circle: typeof circlesTable.$inferSelect) {
  const teacher = circle.teacherId
    ? await db
        .select({ name: usersTable.name })
        .from(usersTable)
        .where(eq(usersTable.id, circle.teacherId))
        .limit(1)
    : [];

  const [{ value: studentCount }] = await db
    .select({ value: count() })
    .from(studentsTable)
    .where(eq(studentsTable.circleId, circle.id));

  return {
    id: circle.id,
    name: circle.name,
    teacherId: circle.teacherId,
    teacherName: teacher[0]?.name ?? null,
    studentCount: Number(studentCount),
    createdAt: circle.createdAt,
  };
}

router.get("/circles", async (req, res) => {
  const circles = await db.select().from(circlesTable).orderBy(circlesTable.name);
  const result = await Promise.all(circles.map(circleWithDetails));
  res.json(result);
});

router.post("/circles", async (req, res) => {
  const { name, teacherId } = req.body;
  if (!name) {
    res.status(400).json({ error: "Name required" });
    return;
  }

  const [circle] = await db
    .insert(circlesTable)
    .values({ name, teacherId: teacherId ?? null })
    .returning();

  res.status(201).json(await circleWithDetails(circle));
});

router.get("/circles/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [circle] = await db
    .select()
    .from(circlesTable)
    .where(eq(circlesTable.id, id))
    .limit(1);

  if (!circle) {
    res.status(404).json({ error: "Circle not found" });
    return;
  }

  res.json(await circleWithDetails(circle));
});

router.patch("/circles/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, teacherId } = req.body;

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (teacherId !== undefined) updateData.teacherId = teacherId;

  const [circle] = await db
    .update(circlesTable)
    .set(updateData)
    .where(eq(circlesTable.id, id))
    .returning();

  if (!circle) {
    res.status(404).json({ error: "Circle not found" });
    return;
  }

  res.json(await circleWithDetails(circle));
});

router.delete("/circles/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(circlesTable).where(eq(circlesTable.id, id));
  res.status(204).send();
});

router.get("/circles/:id/students", async (req, res) => {
  const id = parseInt(req.params.id);

  const students = await db
    .select({
      student: studentsTable,
      circleName: circlesTable.name,
      afternoonTeacherName: usersTable.name,
    })
    .from(studentsTable)
    .leftJoin(circlesTable, eq(studentsTable.circleId, circlesTable.id))
    .leftJoin(usersTable, eq(studentsTable.afternoonTeacherId, usersTable.id))
    .where(eq(studentsTable.circleId, id))
    .orderBy(studentsTable.name);

  res.json(
    students.map(({ student, circleName, afternoonTeacherName }) => ({
      id: student.id,
      name: student.name,
      circleId: student.circleId,
      circleName: circleName ?? null,
      afternoonTeacherId: student.afternoonTeacherId,
      afternoonTeacherName: afternoonTeacherName ?? null,
      phone: student.phone,
      createdAt: student.createdAt,
    }))
  );
});

export default router;
