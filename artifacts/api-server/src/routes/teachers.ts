import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword } from "./auth";

const router = Router();

router.get("/teachers", async (req, res) => {
  const teachers = await db.select().from(usersTable).orderBy(usersTable.name);
  res.json(
    teachers.map((t) => ({
      id: t.id,
      name: t.name,
      username: t.username,
      role: t.role,
      phone: t.phone,
      createdAt: t.createdAt,
    }))
  );
});

router.post("/teachers", async (req, res) => {
  const { name, username, password, role, phone } = req.body;
  if (!name || !username || !password || !role) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const [teacher] = await db
    .insert(usersTable)
    .values({ name, username, passwordHash: hashPassword(password), role, phone })
    .returning();

  res.status(201).json({
    id: teacher.id,
    name: teacher.name,
    username: teacher.username,
    role: teacher.role,
    phone: teacher.phone,
    createdAt: teacher.createdAt,
  });
});

router.get("/teachers/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [teacher] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .limit(1);

  if (!teacher) {
    res.status(404).json({ error: "Teacher not found" });
    return;
  }

  res.json({
    id: teacher.id,
    name: teacher.name,
    username: teacher.username,
    role: teacher.role,
    phone: teacher.phone,
    createdAt: teacher.createdAt,
  });
});

router.patch("/teachers/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, username, password, role, phone } = req.body;

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (username !== undefined) updateData.username = username;
  if (password !== undefined) updateData.passwordHash = hashPassword(password);
  if (role !== undefined) updateData.role = role;
  if (phone !== undefined) updateData.phone = phone;

  const [teacher] = await db
    .update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, id))
    .returning();

  if (!teacher) {
    res.status(404).json({ error: "Teacher not found" });
    return;
  }

  res.json({
    id: teacher.id,
    name: teacher.name,
    username: teacher.username,
    role: teacher.role,
    phone: teacher.phone,
    createdAt: teacher.createdAt,
  });
});

router.delete("/teachers/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.status(204).send();
});

export default router;
