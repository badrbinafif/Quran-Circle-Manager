import { useGetDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, UserCheck, Percent } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user?.role === "afternoon_teacher") {
      setLocation("/reports/afternoon-teacher");
    }
  }, [user, setLocation]);

  const { data: stats, isLoading, error } = useGetDashboard();

  if (user?.role === "afternoon_teacher") return null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">لوحة القيادة</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-12 text-destructive">
        <p>حدث خطأ أثناء تحميل البيانات</p>
      </div>
    );
  }

  const statCards = [
    { title: "إجمالي الطلاب", value: stats.totalStudents, icon: Users, color: "text-blue-500" },
    { title: "الحلقات النشطة", value: stats.totalCircles, icon: BookOpen, color: "text-green-500" },
    { title: "المعلمين", value: stats.totalTeachers, icon: UserCheck, color: "text-purple-500" },
    { title: "نسبة الحضور اليوم", value: `${Math.round(stats.todayAttendanceRate || 0)}%`, icon: Percent, color: "text-accent" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-primary">لوحة القيادة</h1>
        <p className="text-muted-foreground mt-2">نظرة عامة على أداء الحلقات والطلاب</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">إحصائيات الحلقات (اليوم)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.circleStats?.map(circle => (
                <div key={circle.circleId} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <span className="font-medium">{circle.circleName}</span>
                  <div className="text-sm">
                    <span className="text-primary font-bold">{circle.todayPresent}</span>
                    <span className="text-muted-foreground mx-1">من</span>
                    <span>{circle.studentCount}</span>
                  </div>
                </div>
              ))}
              {(!stats.circleStats || stats.circleStats.length === 0) && (
                <p className="text-muted-foreground text-center py-4">لا توجد إحصائيات للحلقات اليوم</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">أحدث التسميعات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentRecitations?.map(rec => (
                <div key={rec.id} className="flex flex-col p-3 border border-border rounded-lg gap-2">
                  <div className="flex justify-between items-start">
                    <span className="font-bold">{rec.studentName}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      rec.grade === 'excellent' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                      rec.grade === 'good' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' :
                      rec.grade === 'acceptable' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                    }`}>
                      {rec.grade === 'excellent' ? 'ممتاز' : rec.grade === 'good' ? 'جيد جداً' : rec.grade === 'acceptable' ? 'جيد' : 'يحتاج تحسين'}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground flex gap-2">
                    <span>{rec.circleName}</span>
                    <span>•</span>
                    <span>من {rec.fromSurah} إلى {rec.toSurah}</span>
                  </div>
                </div>
              ))}
              {(!stats.recentRecitations || stats.recentRecitations.length === 0) && (
                <p className="text-muted-foreground text-center py-4">لا توجد تسميعات مسجلة حديثاً</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
