import { Router } from "express";
import { db } from "@workspace/db";
import {
  attendanceTable,
  studentsTable,
  circlesTable,
  usersTable,
  recitationsTable,
} from "@workspace/db";
import { eq, and, gte, lte, count } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/reports/circle-attendance", async (req, res) => {
  const { circleId, fromDate, toDate } = req.query;
  if (!circleId || !fromDate || !toDate) {
    res.status(400).json({ error: "circleId, fromDate, and toDate are required" });
    return;
  }

  const cid = parseInt(circleId as string);

  const [circle] = await db
    .select({ circle: circlesTable, teacherName: usersTable.name })
    .from(circlesTable)
    .leftJoin(usersTable, eq(circlesTable.teacherId, usersTable.id))
    .where(eq(circlesTable.id, cid))
    .limit(1);

  if (!circle) {
    res.status(404).json({ error: "Circle not found" });
    return;
  }

  const students = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.circleId, cid))
    .orderBy(studentsTable.name);

  // Get attendance for all students in the date range
  const allAttendance = await db
    .select()
    .from(attendanceTable)
    .where(
      and(
        eq(attendanceTable.circleId, cid),
        gte(attendanceTable.date, fromDate as string),
        lte(attendanceTable.date, toDate as string)
      )
    );

  // Count unique session dates
  const sessionDates = [...new Set(allAttendance.map((a) => a.date))];

  const studentSummaries = students.map((student) => {
    const studentAttendance = allAttendance.filter((a) => a.studentId === student.id);
    const presentDays = studentAttendance.filter((a) => a.status === "present").length;
    const absentDays = studentAttendance.filter((a) => a.status === "absent").length;
    const excusedDays = studentAttendance.filter((a) => a.status === "excused").length;
    const totalDays = studentAttendance.length;
    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    return {
      studentId: student.id,
      studentName: student.name,
      totalDays,
      presentDays,
      absentDays,
      excusedDays,
      attendanceRate: Math.round(attendanceRate * 10) / 10,
    };
  });

  // Get student count
  const [{ value: studentCount }] = await db
    .select({ value: count() })
    .from(studentsTable)
    .where(eq(studentsTable.circleId, cid));

  res.json({
    circle: {
      id: circle.circle.id,
      name: circle.circle.name,
      teacherId: circle.circle.teacherId,
      teacherName: circle.teacherName ?? null,
      studentCount: Number(studentCount),
      createdAt: circle.circle.createdAt,
    },
    fromDate,
    toDate,
    totalSessions: sessionDates.length,
    students: studentSummaries,
  });
});

router.get("/reports/afternoon-teacher", async (req, res) => {
  const { teacherId, fromDate, toDate } = req.query;
  if (!teacherId || !fromDate || !toDate) {
    res.status(400).json({ error: "teacherId, fromDate, and toDate are required" });
    return;
  }

  const tid = parseInt(teacherId as string);

  const [teacher] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, tid))
    .limit(1);

  if (!teacher) {
    res.status(404).json({ error: "Teacher not found" });
    return;
  }

  const students = await db
    .select({
      student: studentsTable,
      circle: circlesTable,
    })
    .from(studentsTable)
    .leftJoin(circlesTable, eq(studentsTable.circleId, circlesTable.id))
    .where(eq(studentsTable.afternoonTeacherId, tid))
    .orderBy(studentsTable.name);

  const studentDetails = await Promise.all(
    students.map(async ({ student, circle }) => {
      let morningTeacherName: string | null = null;
      if (circle?.teacherId) {
        const [mt] = await db
          .select({ name: usersTable.name })
          .from(usersTable)
          .where(eq(usersTable.id, circle.teacherId))
          .limit(1);
        morningTeacherName = mt?.name ?? null;
      }

      const recitations = await db
        .select()
        .from(recitationsTable)
        .where(
          and(
            eq(recitationsTable.studentId, student.id),
            gte(recitationsTable.date, fromDate as string),
            lte(recitationsTable.date, toDate as string)
          )
        )
        .orderBy(recitationsTable.date);

      const attendance = await db
        .select()
        .from(attendanceTable)
        .where(
          and(
            eq(attendanceTable.studentId, student.id),
            gte(attendanceTable.date, fromDate as string),
            lte(attendanceTable.date, toDate as string)
          )
        )
        .orderBy(attendanceTable.date);

      return {
        studentId: student.id,
        studentName: student.name,
        morningCircleName: circle?.name ?? null,
        morningTeacherName,
        recitations: recitations.map((r) => ({
          id: r.id,
          studentId: r.studentId,
          studentName: student.name,
          circleId: r.circleId,
          circleName: circle?.name ?? null,
          morningTeacherName,
          afternoonTeacherId: student.afternoonTeacherId,
          date: r.date,
          fromSurah: r.fromSurah,
          toSurah: r.toSurah,
          fromVerse: r.fromVerse,
          toVerse: r.toVerse,
          grade: r.grade,
          notes: r.notes,
        })),
        attendance: attendance.map((a) => ({
          id: a.id,
          studentId: a.studentId,
          studentName: student.name,
          circleId: a.circleId,
          circleName: circle?.name ?? null,
          date: a.date,
          status: a.status,
          notes: a.notes,
        })),
      };
    })
  );

  res.json({
    teacher: {
      id: teacher.id,
      name: teacher.name,
      username: teacher.username,
      role: teacher.role,
      phone: teacher.phone,
      createdAt: teacher.createdAt,
    },
    fromDate,
    toDate,
    students: studentDetails,
  });
});

router.get("/reports/dashboard", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  const [{ value: totalStudents }] = await db.select({ value: count() }).from(studentsTable);
  const [{ value: totalCircles }] = await db.select({ value: count() }).from(circlesTable);
  const [{ value: totalTeachers }] = await db.select({ value: count() }).from(usersTable);

  const todayAttendance = await db
    .select()
    .from(attendanceTable)
    .where(eq(attendanceTable.date, today));

  const todayPresent = todayAttendance.filter((a) => a.status === "present").length;
  const todayAbsent = todayAttendance.filter((a) => a.status === "absent").length;
  const todayTotal = todayAttendance.length;
  const todayAttendanceRate = todayTotal > 0 ? (todayPresent / todayTotal) * 100 : 0;

  const recentRecs = await db
    .select({ r: recitationsTable, s: studentsTable, c: circlesTable })
    .from(recitationsTable)
    .leftJoin(studentsTable, eq(recitationsTable.studentId, studentsTable.id))
    .leftJoin(circlesTable, eq(recitationsTable.circleId, circlesTable.id))
    .orderBy(sql`${recitationsTable.createdAt} DESC`)
    .limit(10);

  const circles = await db
    .select()
    .from(circlesTable)
    .orderBy(circlesTable.name);

  const circleStats = await Promise.all(
    circles.map(async (circle) => {
      const [{ value: studentCount }] = await db
        .select({ value: count() })
        .from(studentsTable)
        .where(eq(studentsTable.circleId, circle.id));

      const todayPresentInCircle = todayAttendance.filter(
        (a) => a.circleId === circle.id && a.status === "present"
      ).length;

      return {
        circleId: circle.id,
        circleName: circle.name,
        studentCount: Number(studentCount),
        todayPresent: todayPresentInCircle,
      };
    })
  );

  res.json({
    totalStudents: Number(totalStudents),
    totalCircles: Number(totalCircles),
    totalTeachers: Number(totalTeachers),
    todayPresent,
    todayAbsent,
    todayAttendanceRate: Math.round(todayAttendanceRate * 10) / 10,
    recentRecitations: recentRecs.map(({ r, s, c }) => ({
      id: r.id,
      studentId: r.studentId,
      studentName: s?.name ?? "غير معروف",
      circleId: r.circleId,
      circleName: c?.name ?? null,
      morningTeacherName: null,
      afternoonTeacherId: s?.afternoonTeacherId ?? null,
      date: r.date,
      fromSurah: r.fromSurah,
      toSurah: r.toSurah,
      fromVerse: r.fromVerse,
      toVerse: r.toVerse,
      grade: r.grade,
      notes: r.notes,
    })),
    circleStats,
  });
});

export default router;
