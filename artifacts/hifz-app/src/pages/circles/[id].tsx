import { useParams } from "wouter";
import { useGetCircle, useGetCircleStudents, useRecordAttendance, useCreateRecitation, useGetAttendance } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Check, X, AlertCircle, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { QURAN_SURAHS } from "@/lib/constants";

type AttendanceStatus = 'present' | 'absent' | 'excused';

const recitationSchema = z.object({
  studentId: z.coerce.number(),
  date: z.string(),
  fromSurah: z.string().min(1, "السورة مطلوبة"),
  toSurah: z.string().min(1, "السورة مطلوبة"),
  fromVerse: z.coerce.number().optional(),
  toVerse: z.coerce.number().optional(),
  grade: z.enum(["excellent", "good", "acceptable", "needs_improvement"]),
  errorsCount: z.coerce.number().min(0).optional(),
  notes: z.string().optional()
});

export default function CircleDetail() {
  const { id } = useParams<{ id: string }>();
  const circleId = parseInt(id!);
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const { data: circle, isLoading: isLoadingCircle } = useGetCircle(circleId, { query: { enabled: !!circleId } });
  const { data: students, isLoading: isLoadingStudents } = useGetCircleStudents(circleId, { query: { enabled: !!circleId } });
  const { data: todayAttendance } = useGetAttendance({ circleId, date: today }, { query: { enabled: !!circleId } });
  
  const recordAttendance = useRecordAttendance();
  const createRecitation = useCreateRecitation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [attendanceState, setAttendanceState] = useState<Record<number, AttendanceStatus>>({});
  
  // Init attendance state from existing data
  useMemo(() => {
    if (todayAttendance && todayAttendance.length > 0) {
      const state: Record<number, AttendanceStatus> = {};
      todayAttendance.forEach(a => {
        state[a.studentId] = a.status as AttendanceStatus;
      });
      setAttendanceState(state);
    } else if (students) {
      const state: Record<number, AttendanceStatus> = {};
      students.forEach(s => {
        state[s.id] = 'present'; // Default
      });
      setAttendanceState(state);
    }
  }, [todayAttendance, students]);

  const handleSaveAttendance = async () => {
    if (!students) return;
    
    const records = students.map(s => ({
      studentId: s.id,
      status: attendanceState[s.id] || 'present'
    }));

    try {
      await recordAttendance.mutateAsync({
        data: {
          date: today,
          circleId,
          records
        }
      });
      toast({ title: "تم حفظ الحضور بنجاح" });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
    } catch (e) {
      toast({ title: "حدث خطأ أثناء الحفظ", variant: "destructive" });
    }
  };

  const handleStatusChange = (studentId: number, status: AttendanceStatus) => {
    setAttendanceState(prev => ({ ...prev, [studentId]: status }));
  };

  if (isLoadingCircle || isLoadingStudents) {
    return <div className="p-8 text-center">جاري التحميل...</div>;
  }

  if (!circle) return <div className="p-8 text-center">الحلقة غير موجودة</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{circle.name}</h1>
          <p className="text-muted-foreground mt-1">المعلم: {circle.teacherName || "غير محدد"} • {circle.studentCount || 0} طلاب</p>
        </div>
        <div className="text-lg font-medium bg-primary/10 text-primary px-4 py-2 rounded-md">
          اليوم: {today}
        </div>
      </div>

      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="attendance" className="flex-1">تحضير الطلاب</TabsTrigger>
          <TabsTrigger value="recitation" className="flex-1">تسجيل التسميع</TabsTrigger>
        </TabsList>
        
        <TabsContent value="attendance" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleSaveAttendance} disabled={recordAttendance.isPending} className="bg-primary">
              {recordAttendance.isPending ? "جاري الحفظ..." : "حفظ الحضور والغياب"}
            </Button>
          </div>
          
          <div className="border rounded-md overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم الطالب</TableHead>
                  <TableHead className="text-center">حاضر</TableHead>
                  <TableHead className="text-center">غائب</TableHead>
                  <TableHead className="text-center">مستأذن</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students?.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8">لا يوجد طلاب في هذه الحلقة</TableCell></TableRow>
                ) : (
                  students?.map(student => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell className="text-center">
                        <Button 
                          size="icon" 
                          variant={attendanceState[student.id] === 'present' ? 'default' : 'outline'}
                          className={attendanceState[student.id] === 'present' ? 'bg-green-600 hover:bg-green-700' : ''}
                          onClick={() => handleStatusChange(student.id, 'present')}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          size="icon" 
                          variant={attendanceState[student.id] === 'absent' ? 'default' : 'outline'}
                          className={attendanceState[student.id] === 'absent' ? 'bg-red-600 hover:bg-red-700' : ''}
                          onClick={() => handleStatusChange(student.id, 'absent')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          size="icon" 
                          variant={attendanceState[student.id] === 'excused' ? 'default' : 'outline'}
                          className={attendanceState[student.id] === 'excused' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                          onClick={() => handleStatusChange(student.id, 'excused')}
                        >
                          <AlertCircle className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        <TabsContent value="recitation" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {students?.filter(s => attendanceState[s.id] !== 'absent').map(student => (
              <RecitationCard 
                key={student.id} 
                student={student} 
                today={today} 
                onSave={async (data) => {
                  try {
                    await createRecitation.mutateAsync({ data });
                    toast({ title: "تم تسجيل التسميع بنجاح" });
                    queryClient.invalidateQueries({ queryKey: ["/api/recitations"] });
                  } catch (e) {
                    toast({ title: "حدث خطأ", variant: "destructive" });
                  }
                }}
              />
            ))}
            {students?.filter(s => attendanceState[s.id] !== 'absent').length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground border rounded bg-card">
                لا يوجد طلاب حاضرين لتسجيل التسميع
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RecitationCard({ student, today, onSave }: { student: any, today: string, onSave: (data: any) => Promise<void> }) {
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<z.infer<typeof recitationSchema>>({
    resolver: zodResolver(recitationSchema),
    defaultValues: {
      studentId: student.id,
      date: today,
      fromSurah: "",
      toSurah: "",
      grade: "excellent",
      errorsCount: 0,
      notes: ""
    }
  });

  const onSubmit = async (values: z.infer<typeof recitationSchema>) => {
    await onSave(values);
    setIsOpen(false);
    form.reset({ ...values, notes: "", fromVerse: undefined, toVerse: undefined });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="border rounded-lg p-4 bg-card cursor-pointer hover:border-primary transition-colors flex items-center justify-between">
          <span className="font-medium">{student.name}</span>
          <Button size="sm" variant="ghost" className="rounded-full bg-primary/10 text-primary">
            <Plus className="h-4 w-4 ml-1" />
            تسميع
          </Button>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تسجيل تسميع: {student.name}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fromSurah"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>من سورة</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger></FormControl>
                      <SelectContent className="max-h-[200px]">
                        {QURAN_SURAHS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="toSurah"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>إلى سورة</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger></FormControl>
                      <SelectContent className="max-h-[200px]">
                        {QURAN_SURAHS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fromVerse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>من آية (اختياري)</FormLabel>
                    <FormControl><Input type="number" {...field} value={field.value || ""} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="toVerse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>إلى آية (اختياري)</FormLabel>
                    <FormControl><Input type="number" {...field} value={field.value || ""} /></FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>التقييم</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="التقييم" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="excellent">ممتاز</SelectItem>
                      <SelectItem value="good">جيد جداً</SelectItem>
                      <SelectItem value="acceptable">جيد</SelectItem>
                      <SelectItem value="needs_improvement">يحتاج تحسين</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="errorsCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عدد الأخطاء</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} value={field.value ?? 0} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات (اختياري)</FormLabel>
                  <FormControl><Input {...field} value={field.value || ""} /></FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">حفظ</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
