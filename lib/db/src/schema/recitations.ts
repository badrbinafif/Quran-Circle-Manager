import {
  pgTable,
  serial,
  timestamp,
  integer,
  text,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { studentsTable } from "./students";
import { circlesTable } from "./circles";

export const recitationGradeEnum = pgEnum("recitation_grade", [
  "excellent",
  "good",
  "acceptable",
  "needs_improvement",
]);

export const recitationsTable = pgTable("recitations", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id")
    .notNull()
    .references(() => studentsTable.id, { onDelete: "cascade" }),
  circleId: integer("circle_id").references(() => circlesTable.id, {
    onDelete: "set null",
  }),
  date: date("date").notNull(),
  fromSurah: text("from_surah").notNull(),
  toSurah: text("to_surah").notNull(),
  fromVerse: integer("from_verse"),
  toVerse: integer("to_verse"),
  grade: recitationGradeEnum("grade"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRecitationSchema = createInsertSchema(
  recitationsTable
).omit({ id: true, createdAt: true });
export type InsertRecitation = z.infer<typeof insertRecitationSchema>;
export type Recitation = typeof recitationsTable.$inferSelect;
