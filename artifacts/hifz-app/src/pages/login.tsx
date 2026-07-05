import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BookOpen } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export default function Login() {
  const { user, login, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    if (user && !isLoading) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      await login({ data: values });
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في نظام إدارة حلقات التحفيظ",
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: "تأكد من اسم المستخدم وكلمة المرور",
        variant: "destructive",
      });
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><BookOpen className="animate-spin h-10 w-10 text-primary" /></div>;
  if (user) return null;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Right side branding */}
      <div className="md:w-1/2 bg-primary text-primary-foreground p-12 flex flex-col justify-center items-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] bg-repeat mix-blend-overlay"></div>
        <div className="relative z-10 text-center space-y-6">
          <BookOpen className="h-24 w-24 mx-auto text-accent" />
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">نظام إدارة حلقات التحفيظ</h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-md mx-auto">
            منصة متكاملة لمتابعة حفظ ومراجعة القرآن الكريم وإدارة الحلقات القرآنية
          </p>
        </div>
      </div>
      
      {/* Left side login form */}
      <div className="md:w-1/2 p-8 md:p-12 flex items-center justify-center">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center md:text-right">
            <h2 className="text-3xl font-bold text-foreground">تسجيل الدخول</h2>
            <p className="text-muted-foreground mt-2">الرجاء إدخال بيانات الدخول الخاصة بك</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم المستخدم</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل اسم المستخدم" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كلمة المرور</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="أدخل كلمة المرور" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full h-12 text-lg font-medium shadow-md hover:shadow-lg transition-shadow bg-primary text-primary-foreground" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
