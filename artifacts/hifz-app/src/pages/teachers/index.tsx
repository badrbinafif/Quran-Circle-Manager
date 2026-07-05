import { useState } from "react";
import { useGetTeachers, useCreateTeacher, useUpdateTeacher, useDeleteTeacher } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const teacherSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().optional(), // optional for edit
  role: z.enum(["supervisor", "morning_teacher", "afternoon_teacher"]),
  phone: z.string().optional()
});

export default function Teachers() {
  const { data: teachers, isLoading } = useGetTeachers();
  const createTeacher = useCreateTeacher();
  const updateTeacher = useUpdateTeacher();
  const deleteTeacher = useDeleteTeacher();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const form = useForm<z.infer<typeof teacherSchema>>({
    resolver: zodResolver(teacherSchema),
    defaultValues: { name: "", username: "", password: "", role: "morning_teacher", phone: "" }
  });

  const onSubmit = async (values: z.infer<typeof teacherSchema>) => {
    try {
      if (editId) {
        // Omitting password if empty
        const updateData: any = { name: values.name, username: values.username, role: values.role, phone: values.phone };
        if (values.password) updateData.password = values.password;
        
        await updateTeacher.mutateAsync({ id: editId, data: updateData });
        toast({ title: "تم التحديث بنجاح" });
      } else {
        if (!values.password) {
          form.setError("password", { message: "كلمة المرور مطلوبة للمعلم الجديد" });
          return;
        }
        await createTeacher.mutateAsync({ data: values as any });
        toast({ title: "تمت الإضافة بنجاح" });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      setIsCreateOpen(false);
      setEditId(null);
      form.reset();
    } catch (e) {
      toast({ title: "حدث خطأ", variant: "destructive" });
    }
  };

  const handleEdit = (teacher: any) => {
    setEditId(teacher.id);
    form.reset({ name: teacher.name, username: teacher.username || "", password: "", role: teacher.role as any, phone: teacher.phone || "" });
    setIsCreateOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا المعلم؟")) {
      try {
        await deleteTeacher.mutateAsync({ id });
        toast({ title: "تم الحذف بنجاح" });
        queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      } catch (e) {
        toast({ title: "حدث خطأ أثناء الحذف", variant: "destructive" });
      }
    }
  };

  const roleLabel = (role: string) => {
    switch (role) {
      case 'supervisor': return 'مشرف';
      case 'morning_teacher': return 'معلم صباحي';
      case 'afternoon_teacher': return 'معلم مسائي';
      default: return role;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">المعلمين</h1>
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) { setEditId(null); form.reset({name: "", username: "", password: "", role: "morning_teacher", phone: ""}); }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground"><Plus className="ml-2 h-4 w-4"/> إضافة معلم</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "تعديل معلم" : "إضافة معلم جديد"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم المستخدم (للدخول)</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كلمة المرور {editId && "(اتركه فارغاً لعدم التغيير)"}</FormLabel>
                      <FormControl><Input type="password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الدور</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="اختر الدور" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="supervisor">مشرف</SelectItem>
                          <SelectItem value="morning_teacher">معلم صباحي</SelectItem>
                          <SelectItem value="afternoon_teacher">معلم مسائي</SelectItem>
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

      <div className="border rounded-md overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead>الدور</TableHead>
              <TableHead>اسم المستخدم</TableHead>
              <TableHead>رقم الهاتف</TableHead>
              <TableHead className="text-left">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">جاري التحميل...</TableCell></TableRow>
            ) : teachers?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">لا يوجد معلمين</TableCell></TableRow>
            ) : (
              teachers?.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell className="font-medium">{teacher.name}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      teacher.role === 'supervisor' ? 'bg-purple-100 text-purple-800' :
                      teacher.role === 'morning_teacher' ? 'bg-blue-100 text-blue-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {roleLabel(teacher.role)}
                    </span>
                  </TableCell>
                  <TableCell>{teacher.username}</TableCell>
                  <TableCell>{teacher.phone || "-"}</TableCell>
                  <TableCell className="text-left space-x-2 space-x-reverse">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(teacher)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(teacher.id)}>
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
