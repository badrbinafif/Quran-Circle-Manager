import { useState } from "react";
import { useGetStudents, useCreateStudent, useUpdateStudent, useDeleteStudent, useGetCircles, useGetTeachers } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Edit, Trash2, Eye, Filter } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const studentSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  circleId: z.coerce.number().optional().nullable(),
  afternoonTeacherId: z.coerce.number().optional().nullable(),
  phone: z.string().optional()
});

export default function Students() {
  const [filterCircle, setFilterCircle] = useState<string>("");
  const [filterTeacher, setFilterTeacher] = useState<string>("");
  
  const { data: students, isLoading } = useGetStudents({ 
    circleId: filterCircle ? parseInt(filterCircle) : undefined,
    afternoonTeacherId: filterTeacher ? parseInt(filterTeacher) : undefined
  });
  const { data: circles } = useGetCircles();
  const { data: teachers } = useGetTeachers();
  
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const form = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: { name: "", circleId: null, afternoonTeacherId: null, phone: "" }
  });

  const onSubmit = async (values: z.infer<typeof studentSchema>) => {
    try {
      if (editId) {
        await updateStudent.mutateAsync({ id: editId, data: { name: values.name, circleId: values.circleId || null, afternoonTeacherId: values.afternoonTeacherId || null, phone: values.phone } });
        toast({ title: "تم التحديث بنجاح" });
      } else {
        await createStudent.mutateAsync({ data: { name: values.name, circleId: values.circleId || undefined, afternoonTeacherId: values.afternoonTeacherId || undefined, phone: values.phone } });
        toast({ title: "تمت الإضافة بنجاح" });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setIsCreateOpen(false);
      setEditId(null);
      form.reset();
    } catch (e) {
      toast({ title: "حدث خطأ", variant: "destructive" });
    }
  };

  const handleEdit = (student: any) => {
    setEditId(student.id);
    form.reset({ name: student.name, circleId: student.circleId, afternoonTeacherId: student.afternoonTeacherId, phone: student.phone || "" });
    setIsCreateOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا الطالب؟")) {
      try {
        await deleteStudent.mutateAsync({ id });
        toast({ title: "تم الحذف بنجاح" });
        queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      } catch (e) {
        toast({ title: "حدث خطأ أثناء الحذف", variant: "destructive" });
      }
    }
  };

  const afternoonTeachers = teachers?.filter(t => t.role === "afternoon_teacher" || t.role === "supervisor") || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">الطلاب</h1>
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) { setEditId(null); form.reset({name: "", circleId: null, afternoonTeacherId: null, phone: ""}); }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground"><Plus className="ml-2 h-4 w-4"/> إضافة طالب</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "تعديل طالب" : "إضافة طالب جديد"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم الطالب</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="circleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الحلقة الصباحية (اختياري)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value?.toString() || ""}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="اختر الحلقة" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {circles?.map(c => (
                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="afternoonTeacherId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>معلم الفترة المسائية (اختياري)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value?.toString() || ""}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="اختر المعلم" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {afternoonTeachers.map(t => (
                            <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الهاتف (اختياري)</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                  حفظ
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-md border">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">تصفية:</span>
        </div>
        <Select value={filterCircle} onValueChange={setFilterCircle}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="كل الحلقات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">كل الحلقات</SelectItem>
            {circles?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterTeacher} onValueChange={setFilterTeacher}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="كل معلمي المساء" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">كل معلمي المساء</SelectItem>
            {afternoonTeachers.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {(filterCircle || filterTeacher) && (
          <Button variant="ghost" onClick={() => { setFilterCircle(""); setFilterTeacher(""); }}>
            مسح التصفية
          </Button>
        )}
      </div>

      <div className="border rounded-md overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>اسم الطالب</TableHead>
              <TableHead>الحلقة الصباحية</TableHead>
              <TableHead>معلم المساء</TableHead>
              <TableHead>رقم الهاتف</TableHead>
              <TableHead className="text-left">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">جاري التحميل...</TableCell></TableRow>
            ) : students?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">لا يوجد طلاب</TableCell></TableRow>
            ) : (
              students?.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.circleName || "-"}</TableCell>
                  <TableCell>{student.afternoonTeacherName || "-"}</TableCell>
                  <TableCell>{student.phone || "-"}</TableCell>
                  <TableCell className="text-left space-x-2 space-x-reverse">
                    <Link href={`/students/${student.id}`} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 w-9">
                      <Eye className="h-4 w-4" />
                    </Link>
                    <Button variant="outline" size="icon" onClick={() => handleEdit(student)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(student.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
