import { useState } from "react";
import { useGetAttendance, useGetCircles } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { CheckCircle, XCircle, AlertCircle, Filter } from "lucide-react";

export default function AttendanceList() {
  const { data: circles } = useGetCircles();
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [circleId, setCircleId] = useState<string>("");

  const { data: attendance, isLoading } = useGetAttendance({ 
    date: date || undefined,
    circleId: circleId ? parseInt(circleId) : undefined
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">سجل الحضور</h1>

      <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-md border">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">تصفية:</span>
        </div>
        <Input 
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)} 
          className="w-full md:w-[200px]"
        />
        <Select value={circleId} onValueChange={setCircleId}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="كل الحلقات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحلقات</SelectItem>
            {circles?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-md bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>التاريخ</TableHead>
              <TableHead>اسم الطالب</TableHead>
              <TableHead>الحلقة</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>الملاحظات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">جاري التحميل...</TableCell></TableRow>
            ) : attendance?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">لا يوجد سجلات لهذه التصفية</TableCell></TableRow>
            ) : (
              attendance?.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{format(new Date(record.date), 'yyyy-MM-dd')}</TableCell>
                  <TableCell className="font-medium">{record.studentName}</TableCell>
                  <TableCell>{record.circleName || "-"}</TableCell>
                  <TableCell>
                    {record.status === 'present' && <span className="flex items-center text-green-600"><CheckCircle className="h-4 w-4 mr-1" /> حاضر</span>}
                    {record.status === 'absent' && <span className="flex items-center text-red-600"><XCircle className="h-4 w-4 mr-1" /> غائب</span>}
                    {record.status === 'excused' && <span className="flex items-center text-yellow-600"><AlertCircle className="h-4 w-4 mr-1" /> مستأذن</span>}
                  </TableCell>
                  <TableCell>{record.notes || "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
