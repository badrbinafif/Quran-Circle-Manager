import { useState } from "react";
import { useGetCircles, useGetCircleAttendanceReport } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, subDays } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer } from "lucide-react";

export default function CircleAttendanceReport() {
  const { data: circles } = useGetCircles();
  
  const [circleId, setCircleId] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const { data: report, isLoading } = useGetCircleAttendanceReport(
    { circleId: parseInt(circleId), fromDate, toDate },
    { query: { enabled: !!circleId && !!fromDate && !!toDate } }
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center no-print">
        <h1 className="text-3xl font-bold">تقرير حضور حلقة</h1>
        {report && (
          <Button onClick={handlePrint} variant="outline">
            <Printer className="ml-2 h-4 w-4" /> طباعة
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card p-4 rounded-md border no-print">
        <div className="space-y-2">
          <Label>اختر الحلقة</Label>
          <Select value={circleId} onValueChange={setCircleId}>
            <SelectTrigger>
              <SelectValue placeholder="اختر الحلقة" />
            </SelectTrigger>
            <SelectContent>
              {circles?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>من تاريخ</Label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>إلى تاريخ</Label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
      </div>

      {isLoading && circleId && <div className="text-center py-8">جاري تحميل التقرير...</div>}

      {report && (
        <div className="border rounded-md bg-card p-6 print:border-none print:shadow-none">
          <div className="text-center mb-8 hidden print-only">
            <h2 className="text-2xl font-bold">تقرير حضور حلقة: {report.circle.name}</h2>
            <p className="text-gray-600">من {fromDate} إلى {toDate}</p>
            <p className="text-gray-600">إجمالي الأيام: {report.totalSessions}</p>
          </div>

          <div className="mb-4 no-print flex gap-4 text-sm text-muted-foreground">
            <span>الحلقة: {report.circle.name}</span>
            <span>إجمالي الأيام: {report.totalSessions}</span>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الطالب</TableHead>
                <TableHead className="text-center">أيام الحضور</TableHead>
                <TableHead className="text-center">أيام الغياب</TableHead>
                <TableHead className="text-center">الاستئذان</TableHead>
                <TableHead className="text-center">نسبة الحضور</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.students.map(student => (
                <TableRow key={student.studentId}>
                  <TableCell className="font-medium">{student.studentName}</TableCell>
                  <TableCell className="text-center text-green-600">{student.presentDays}</TableCell>
                  <TableCell className="text-center text-red-600">{student.absentDays}</TableCell>
                  <TableCell className="text-center text-yellow-600">{student.excusedDays}</TableCell>
                  <TableCell className="text-center font-bold">{Math.round(student.attendanceRate || 0)}%</TableCell>
                </TableRow>
              ))}
              {report.students.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-4">لا توجد بيانات لهذه الفترة</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
