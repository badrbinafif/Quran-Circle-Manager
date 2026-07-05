import { useState } from "react";
import { useGetTeachers, useGetAfternoonTeacherReport } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, subDays } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function AfternoonTeacherReport() {
  const { user } = useAuth();
  const { data: teachers } = useGetTeachers();
  
  const afternoonTeachers = teachers?.filter(t => t.role === "afternoon_teacher" || t.role === "supervisor") || [];
  
  // Default to own ID if afternoon teacher
  const defaultTeacherId = user?.role === "afternoon_teacher" ? user.id.toString() : "";
  const [teacherId, setTeacherId] = useState<string>(defaultTeacherId);
  const [fromDate, setFromDate] = useState<string>(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const { data: report, isLoading } = useGetAfternoonTeacherReport(
    { teacherId: parseInt(teacherId), fromDate, toDate },
    { query: { enabled: !!teacherId && !!fromDate && !!toDate } }
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center no-print">
        <h1 className="text-3xl font-bold">تقرير إنجاز الفترة المسائية</h1>
        {report && (
          <Button onClick={handlePrint} variant="outline">
            <Printer className="ml-2 h-4 w-4" /> طباعة
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card p-4 rounded-md border no-print">
        {user?.role === "supervisor" && (
          <div className="space-y-2">
            <Label>اختر المعلم</Label>
            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر المعلم" />
              </SelectTrigger>
              <SelectContent>
                {afternoonTeachers.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-2">
          <Label>من تاريخ</Label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>إلى تاريخ</Label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
      </div>

      {isLoading && teacherId && <div className="text-center py-8">جاري تحميل التقرير...</div>}

      {report && (
        <div className="space-y-6 print-only-wrapper">
          <div className="text-center mb-8 hidden print-only">
            <h2 className="text-2xl font-bold">تقرير إنجاز الفترة المسائية - المعلم: {report.teacher.name}</h2>
            <p className="text-gray-600">من {fromDate} إلى {toDate}</p>
          </div>

          {report.students.map(student => (
            <div key={student.studentId} className="border rounded-md bg-card p-4 break-inside-avoid">
              <h3 className="text-lg font-bold mb-2">{student.studentName} <span className="text-sm font-normal text-muted-foreground">(حلقة: {student.morningCircleName || "-"})</span></h3>
              
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">التسميعات</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>من - إلى</TableHead>
                      <TableHead>التقييم</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.recitations && student.recitations.length > 0 ? (
                      student.recitations.map(rec => (
                        <TableRow key={rec.id}>
                          <TableCell>{format(new Date(rec.date), 'yyyy-MM-dd')}</TableCell>
                          <TableCell>{rec.fromSurah} - {rec.toSurah}</TableCell>
                          <TableCell>
                            {rec.grade === 'excellent' ? 'ممتاز' : rec.grade === 'good' ? 'جيد جداً' : rec.grade === 'acceptable' ? 'جيد' : 'يحتاج تحسين'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">لا يوجد</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
          {report.students.length === 0 && (
            <div className="text-center py-8 bg-card border rounded-md">لا يوجد طلاب لهذا المعلم أو لا توجد بيانات.</div>
          )}
        </div>
      )}
    </div>
  );
}
