import { useState, useMemo } from "react";
import { useGetStudents, useGetRecitations, useGetAttendance } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachWeekOfInterval, eachDayOfInterval, parseISO } from "date-fns";
import { arSA } from "date-fns/locale";

const GRADE_LABELS: Record<string, string> = {
  excellent: "ممتاز",
  good: "جيد جداً",
  acceptable: "جيد",
  needs_improvement: "يحتاج تحسين",
};

const STATUS_LABELS: Record<string, string> = {
  present: "حاضر",
  absent: "غائب",
  excused: "مستأذن",
};

function getHijriYear() {
  return "1446";
}

function arabicDayName(dateStr: string) {
  const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const d = parseISO(dateStr);
  return days[d.getDay()];
}

export default function StudentFollowupReport() {
  const currentDate = new Date();
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>(format(currentDate, "yyyy-MM"));

  const { data: students } = useGetStudents();

  const fromDate = selectedMonth ? format(startOfMonth(parseISO(selectedMonth + "-01")), "yyyy-MM-dd") : "";
  const toDate = selectedMonth ? format(endOfMonth(parseISO(selectedMonth + "-01")), "yyyy-MM-dd") : "";

  const { data: recitations } = useGetRecitations(
    { studentId: selectedStudentId ? parseInt(selectedStudentId) : undefined, fromDate: fromDate || undefined, toDate: toDate || undefined },
    { query: { enabled: !!selectedStudentId && !!fromDate } }
  );

  const { data: attendance } = useGetAttendance(
    { studentId: selectedStudentId ? parseInt(selectedStudentId) : undefined, fromDate: fromDate || undefined, toDate: toDate || undefined },
    { query: { enabled: !!selectedStudentId && !!fromDate } }
  );

  const selectedStudent = students?.find(s => s.id === parseInt(selectedStudentId));

  const weeks = useMemo(() => {
    if (!fromDate || !toDate) return [];
    const monthStart = parseISO(fromDate);
    const monthEnd = parseISO(toDate);
    const weekStarts = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 0 });
    return weekStarts.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
      const days = eachDayOfInterval({
        start: weekStart < monthStart ? monthStart : weekStart,
        end: weekEnd > monthEnd ? monthEnd : weekEnd,
      });
      return { weekStart, weekEnd, days };
    });
  }, [fromDate, toDate]);

  const recitationsByDate = useMemo(() => {
    const map: Record<string, typeof recitations> = {};
    recitations?.forEach(r => {
      if (!map[r.date]) map[r.date] = [];
      map[r.date]!.push(r);
    });
    return map;
  }, [recitations]);

  const attendanceByDate = useMemo(() => {
    const map: Record<string, string> = {};
    attendance?.forEach(a => { map[a.date] = a.status; });
    return map;
  }, [attendance]);

  const totalRecitations = recitations?.length ?? 0;
  const totalErrors = recitations?.reduce((sum, r) => sum + (r.errorsCount ?? 0), 0) ?? 0;
  const totalPresent = attendance?.filter(a => a.status === "present").length ?? 0;
  const totalAbsent = attendance?.filter(a => a.status === "absent").length ?? 0;
  const totalExcused = attendance?.filter(a => a.status === "excused").length ?? 0;

  const months = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(currentDate.getFullYear(), i, 1);
    months.push({ value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy", { locale: arSA }) });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold">كشف متابعة الطالب</h1>
          <p className="text-muted-foreground text-sm mt-1">تقرير أسبوعي وشهري لكل طالب</p>
        </div>
        <Button onClick={() => window.print()} className="gap-2 bg-primary print:hidden">
          <Printer className="h-4 w-4" />
          طباعة الكشف
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 print:hidden">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">اختر الطالب</label>
          <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
            <SelectTrigger><SelectValue placeholder="اختر طالباً..." /></SelectTrigger>
            <SelectContent>
              {students?.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">الشهر</label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger><SelectValue placeholder="اختر الشهر..." /></SelectTrigger>
            <SelectContent>
              {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedStudentId && selectedStudent && (
        <div id="print-area" className="bg-white text-black rounded-lg border border-gray-300 overflow-hidden print:border-none print:rounded-none">
          <div className="p-4 border-b border-gray-300 bg-green-800 text-white print:bg-white print:text-black print:border-b-2 print:border-black">
            <h2 className="text-center text-lg font-bold">
              كشف متابعة الطالب في البرنامج الصباحي لعام 1446 هـ
            </h2>
          </div>

          <div className="p-3 border-b border-gray-200 grid grid-cols-3 gap-4 text-sm bg-gray-50 print:bg-white">
            <div><span className="font-bold">اسم الطالب: </span>{selectedStudent.name}</div>
            <div><span className="font-bold">الحلقة: </span>{selectedStudent.circleName ?? "—"}</div>
            <div><span className="font-bold">المعلم: </span>{selectedStudent.morningTeacherName ?? "—"}</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-green-700 text-white print:bg-gray-200 print:text-black">
                  <th className="border border-gray-300 p-2 text-center">اليوم</th>
                  <th className="border border-gray-300 p-2 text-center">التاريخ</th>
                  <th className="border border-gray-300 p-2 text-center">الحضور</th>
                  <th className="border border-gray-300 p-2 text-center">من سورة</th>
                  <th className="border border-gray-300 p-2 text-center">إلى سورة</th>
                  <th className="border border-gray-300 p-2 text-center">من آية</th>
                  <th className="border border-gray-300 p-2 text-center">إلى آية</th>
                  <th className="border border-gray-300 p-2 text-center">التقييم</th>
                  <th className="border border-gray-300 p-2 text-center">عدد الأخطاء</th>
                  <th className="border border-gray-300 p-2 text-center">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {weeks.map((week, wi) => {
                  const weekRecs = week.days.flatMap(d => {
                    const ds = format(d, "yyyy-MM-dd");
                    return recitationsByDate[ds] ?? [];
                  });
                  const weekErrors = weekRecs.reduce((s, r) => s + (r.errorsCount ?? 0), 0);
                  const weekPresent = week.days.filter(d => attendanceByDate[format(d, "yyyy-MM-dd")] === "present").length;

                  return (
                    <>
                      {week.days.map((day, di) => {
                        const ds = format(day, "yyyy-MM-dd");
                        const dayRecs = recitationsByDate[ds] ?? [];
                        const attStatus = attendanceByDate[ds];
                        const isWeekend = day.getDay() === 5 || day.getDay() === 6;

                        if (isWeekend && !dayRecs.length && !attStatus) return null;

                        if (dayRecs.length === 0) {
                          return (
                            <tr key={ds} className={`${isWeekend ? "bg-gray-100" : di % 2 === 0 ? "bg-white" : "bg-gray-50"} print:bg-white`}>
                              <td className="border border-gray-300 p-2 text-center font-medium">{arabicDayName(ds)}</td>
                              <td className="border border-gray-300 p-2 text-center">{ds}</td>
                              <td className="border border-gray-300 p-2 text-center">
                                {attStatus ? (
                                  <span className={`px-1 rounded text-xs ${attStatus === "present" ? "text-green-700" : attStatus === "absent" ? "text-red-600" : "text-yellow-600"}`}>
                                    {STATUS_LABELS[attStatus]}
                                  </span>
                                ) : "—"}
                              </td>
                              <td className="border border-gray-300 p-2 text-center" colSpan={7}>—</td>
                            </tr>
                          );
                        }

                        return dayRecs.map((rec, ri) => (
                          <tr key={`${ds}-${ri}`} className={`${di % 2 === 0 ? "bg-white" : "bg-gray-50"} print:bg-white`}>
                            {ri === 0 && (
                              <>
                                <td className="border border-gray-300 p-2 text-center font-medium" rowSpan={dayRecs.length}>{arabicDayName(ds)}</td>
                                <td className="border border-gray-300 p-2 text-center" rowSpan={dayRecs.length}>{ds}</td>
                                <td className="border border-gray-300 p-2 text-center" rowSpan={dayRecs.length}>
                                  {attStatus ? (
                                    <span className={`text-xs font-medium ${attStatus === "present" ? "text-green-700" : attStatus === "absent" ? "text-red-600" : "text-yellow-600"}`}>
                                      {STATUS_LABELS[attStatus]}
                                    </span>
                                  ) : "—"}
                                </td>
                              </>
                            )}
                            <td className="border border-gray-300 p-2 text-center">{rec.fromSurah}</td>
                            <td className="border border-gray-300 p-2 text-center">{rec.toSurah}</td>
                            <td className="border border-gray-300 p-2 text-center">{rec.fromVerse ?? "—"}</td>
                            <td className="border border-gray-300 p-2 text-center">{rec.toVerse ?? "—"}</td>
                            <td className="border border-gray-300 p-2 text-center">{rec.grade ? GRADE_LABELS[rec.grade] : "—"}</td>
                            <td className="border border-gray-300 p-2 text-center font-bold text-red-600">{rec.errorsCount ?? 0}</td>
                            <td className="border border-gray-300 p-2 text-center text-xs">{rec.notes ?? ""}</td>
                          </tr>
                        ));
                      })}

                      <tr className="bg-green-100 font-bold print:bg-gray-100">
                        <td className="border border-gray-400 p-2 text-center" colSpan={2}>
                          إجمالي الأسبوع {wi + 1}
                        </td>
                        <td className="border border-gray-400 p-2 text-center text-green-700">{weekPresent} حاضر</td>
                        <td className="border border-gray-400 p-2 text-center" colSpan={4}>
                          عدد الدروس: {weekRecs.length}
                        </td>
                        <td className="border border-gray-400 p-2 text-center" colSpan={2}>
                          مجموع الأخطاء: {weekErrors}
                        </td>
                        <td className="border border-gray-400 p-2 text-center"></td>
                      </tr>
                    </>
                  );
                })}

                <tr className="bg-green-800 text-white font-bold print:bg-gray-300 print:text-black">
                  <td className="border border-gray-400 p-3 text-center" colSpan={2}>إجمالي الشهر</td>
                  <td className="border border-gray-400 p-3 text-center">
                    حاضر: {totalPresent} | غائب: {totalAbsent} | مستأذن: {totalExcused}
                  </td>
                  <td className="border border-gray-400 p-3 text-center" colSpan={4}>
                    عدد الدروس: {totalRecitations}
                  </td>
                  <td className="border border-gray-400 p-3 text-center" colSpan={2}>
                    مجموع الأخطاء: {totalErrors}
                  </td>
                  <td className="border border-gray-400 p-3 text-center"></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t border-gray-200 text-sm bg-gray-50 print:bg-white">
            <span className="font-bold">ملاحظات عامة: </span>
            <span className="text-gray-400">......................................................................</span>
          </div>
        </div>
      )}

      {!selectedStudentId && (
        <div className="text-center py-16 text-muted-foreground border rounded-lg bg-card">
          <p className="text-lg">اختر طالباً لعرض كشف المتابعة</p>
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area { position: fixed; top: 0; right: 0; width: 100%; }
          .print\\:hidden { display: none !important; }
          table { font-size: 11px !important; }
          th, td { padding: 4px !important; }
        }
      `}</style>
    </div>
  );
}
