import { useState } from "react";
import { useGetCircles, useCreateCircle, useUpdateCircle, useDeleteCircle, useGetTeachers } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const circleSchema = z.object({
  name: z.string().min(1, "اسم الحلقة مطلوب"),
  teacherId: z.coerce.number().optional().nullable(),
});

export default function Circles() {
  const { data: circles, isLoading } = useGetCircles();
  const { data: teachers } = useGetTeachers();
  const createCircle = useCreateCircle();
  const updateCircle = useUpdateCircle();
  const deleteCircle = useDeleteCircle();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const form = useForm<z.infer<typeof circleSchema>>({
    resolver: zodResolver(circleSchema),
    defaultValues: { name: "", teacherId: null }
  });

  const onSubmit = async (values: z.infer<typeof circleSchema>) => {
    try {
      if (editId) {
        await updateCircle.mutateAsync({ id: editId, data: { name: values.name, teacherId: values.teacherId || null } });
        toast({ title: "تم التحديث بنجاح" });
      } else {
        await createCircle.mutateAsync({ data: { name: values.name, teacherId: values.teacherId || undefined } });
        toast({ title: "تمت الإضافة بنجاح" });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/circles"] });
      setIsCreateOpen(false);
      setEditId(null);
      form.reset();
    } catch (e) {
      toast({ title: "حدث خطأ", variant: "destructive" });
    }
  };

  const handleEdit = (circle: any) => {
    setEditId(circle.id);
    form.reset({ name: circle.name, teacherId: circle.teacherId });
    setIsCreateOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذه الحلقة؟")) {
      try {
        await deleteCircle.mutateAsync({ id });
        toast({ title: "تم الحذف بنجاح" });
        queryClient.invalidateQueries({ queryKey: ["/api/circles"] });
      } catch (e) {
        toast({ title: "حدث خطأ أثناء الحذف", variant: "destructive" });
      }
    }
  };

  const morningTeachers = teachers?.filter(t => t.role === "morning_teacher" || t.role === "supervisor") || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">الحلقات الصباحية</h1>
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) { setEditId(null); form.reset({name: "", teacherId: null}); }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground"><Plus className="ml-2 h-4 w-4"/> إضافة حلقة</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "تعديل الحلقة" : "إضافة حلقة جديدة"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم الحلقة</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="teacherId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المعلم الصباحي (اختياري)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value?.toString() || ""}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="اختر المعلم" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {morningTeachers.map(t => (
                            <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
              <TableHead>اسم الحلقة</TableHead>
              <TableHead>المعلم</TableHead>
              <TableHead>عدد الطلاب</TableHead>
              <TableHead className="text-left">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8">جاري التحميل...</TableCell></TableRow>
            ) : circles?.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">لا توجد حلقات</TableCell></TableRow>
            ) : (
              circles?.map((circle) => (
                <TableRow key={circle.id}>
                  <TableCell className="font-medium">{circle.name}</TableCell>
                  <TableCell>{circle.teacherName || "-"}</TableCell>
                  <TableCell>{circle.studentCount || 0}</TableCell>
                  <TableCell className="text-left space-x-2 space-x-reverse">
                    <Link href={`/circles/${circle.id}`} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 w-9">
                      <Eye className="h-4 w-4" />
                    </Link>
                    <Button variant="outline" size="icon" onClick={() => handleEdit(circle)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(circle.id)}>
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
