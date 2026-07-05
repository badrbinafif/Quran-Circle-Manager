import { useParams } from "wouter";
import { useGetStudent, useGetAttendance, useGetRecitations } from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { BookOpen, User, Phone, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const studentId = parseInt(id!);
  
  const { data: student, isLoading: isLoadingStudent } = useGetStudent(studentId, { query: { enabled: !!studentId } });
  const { data: attendance, isLoading: isLoadingAttendance } = useGetAttendance({ studentId }, { query: { enabled: !!studentId } });
  const { data: recitations, isLoading: isLoadingRecitations } = useGetRecitations({ studentId }, { query: { enabled: !!studentId } });

  if (isLoadingStudent) return <div className="p-8 text-center">جاري التحميل...</div>;
  if (!student) return <div className="p-8 text-center">الطالب غير موجود</div>;

  const presentCount = attendance?.filter(a => a.status === 'present').length || 0;
  const absentCount = attendance?.filter(a => a.status === 'absent').length || 0;
  const totalDays = attendance?.length || 0;
  const attendanceRate = totalDays ? Math.round((presentCount / totalDays) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center text-2xl font-bold">
          <User />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{student.name}</h1>
          <div className="flex gap-4 text-sm text-muted-foreground mt-2">
            {student.circleName && <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" /> {student.circleName}</span>}
            {student.phone && <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> {student.phone}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">نسبة الحضور</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{attendanceRate}%</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">أيام الحضور</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-green-600">{presentCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">التسميعات</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-primary">{recitations?.length || 0}</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recitations" className="w-full">
        <TabsList>
          <TabsTrigger value="recitations">سجل التسميع</TabsTrigger>
          <TabsTrigger value="attendance">سجل الحضور</TabsTrigger>
        </TabsList>
        
        <TabsContent value="recitations" className="mt-4 border rounded-md bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التاريخ</TableHead>
                <TableHead>الحفظ (من - إلى)</TableHead>
                <TableHead>التقييم</TableHead>
                <TableHead>المعلم</TableHead>
                <TableHead>ملاحظات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingRecitations ? (
                <TableRow><TableCell colSpan={5} className="text-center py-4">جاري التحميل...</TableCell></TableRow>
              ) : recitations?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-4 text-muted-foreground">لا يوجد سجل تسميع</TableCell></TableRow>
              ) : (
                recitations?.map(rec => (
                  <TableRow key={rec.id}>
                    <TableCell>{format(new Date(rec.date), 'yyyy-MM-dd')}</TableCell>
                    <TableCell>من {rec.fromSurah} إلى {rec.toSurah}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        rec.grade === 'excellent' ? 'bg-green-100 text-green-800' :
                        rec.grade === 'good' ? 'bg-blue-100 text-blue-800' :
                        rec.grade === 'acceptable' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {rec.grade === 'excellent' ? 'ممتاز' : rec.grade === 'good' ? 'جيد جداً' : rec.grade === 'acceptable' ? 'جيد' : 'يحتاج تحسين'}
                      </span>
                    </TableCell>
                    <TableCell>{rec.morningTeacherName || "معلم المساء"}</TableCell>
                    <TableCell>{rec.notes || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="attendance" className="mt-4 border rounded-md bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التاريخ</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>ملاحظات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingAttendance ? (
                <TableRow><TableCell colSpan={3} className="text-center py-4">جاري التحميل...</TableCell></TableRow>
              ) : attendance?.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center py-4 text-muted-foreground">لا يوجد سجل حضور</TableCell></TableRow>
              ) : (
                attendance?.map(record => (
                  <TableRow key={record.id}>
                    <TableCell>{format(new Date(record.date), 'yyyy-MM-dd')}</TableCell>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
