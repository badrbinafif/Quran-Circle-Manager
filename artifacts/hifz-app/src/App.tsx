import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { useEffect } from "react";

// Pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Circles from "@/pages/circles/index";
import CircleDetail from "@/pages/circles/[id]";
import Students from "@/pages/students/index";
import StudentDetail from "@/pages/students/[id]";
import Teachers from "@/pages/teachers/index";
import CircleAttendanceReport from "@/pages/reports/circle-attendance";
import AfternoonTeacherReport from "@/pages/reports/afternoon-teacher";
import StudentFollowupReport from "@/pages/reports/student-followup";
import AttendanceList from "@/pages/attendance/index";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component, ...rest }: { component: any, path: string }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>;
  if (!user) return null;

  return (
    <Layout>
      <Component {...rest} />
    </Layout>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={(props) => <ProtectedRoute component={Dashboard} {...props} />} />
      <Route path="/circles" component={(props) => <ProtectedRoute component={Circles} {...props} />} />
      <Route path="/circles/:id" component={(props) => <ProtectedRoute component={CircleDetail} {...props} />} />
      <Route path="/students" component={(props) => <ProtectedRoute component={Students} {...props} />} />
      <Route path="/students/:id" component={(props) => <ProtectedRoute component={StudentDetail} {...props} />} />
      <Route path="/teachers" component={(props) => <ProtectedRoute component={Teachers} {...props} />} />
      <Route path="/reports/circle-attendance" component={(props) => <ProtectedRoute component={CircleAttendanceReport} {...props} />} />
      <Route path="/reports/afternoon-teacher" component={(props) => <ProtectedRoute component={AfternoonTeacherReport} {...props} />} />
      <Route path="/reports/student-followup" component={(props) => <ProtectedRoute component={StudentFollowupReport} {...props} />} />
      <Route path="/attendance" component={(props) => <ProtectedRoute component={AttendanceList} {...props} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
