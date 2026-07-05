import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  GraduationCap,
  ClipboardList,
  FileBarChart,
  LogOut,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const getNavigation = (role?: string) => {
  const items = [
    { name: "لوحة القيادة", href: "/", icon: LayoutDashboard, roles: ["supervisor"] },
    { name: "الحلقات", href: "/circles", icon: Users, roles: ["supervisor", "morning_teacher"] },
    { name: "الطلاب", href: "/students", icon: GraduationCap, roles: ["supervisor", "morning_teacher", "afternoon_teacher"] },
    { name: "المعلمين", href: "/teachers", icon: UserCheck, roles: ["supervisor"] },
    { name: "سجل الحضور", href: "/attendance", icon: ClipboardList, roles: ["supervisor", "morning_teacher"] },
    { name: "تقرير الحلقات", href: "/reports/circle-attendance", icon: FileBarChart, roles: ["supervisor", "morning_teacher"] },
    { name: "تقرير الفترات", href: "/reports/afternoon-teacher", icon: FileBarChart, roles: ["supervisor", "afternoon_teacher"] },
  ];

  if (!role) return [];
  return items.filter(item => item.roles.includes(role));
};

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (!user) return <>{children}</>;

  const navigation = getNavigation(user.role);

  const NavItems = () => (
    <>
      {navigation.map((item) => {
        const isActive = location === item.href || location.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link key={item.name} href={item.href}>
            <span
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                isActive
                  ? "bg-primary text-primary-foreground font-medium"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </span>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-l border-border bg-card">
        <div className="p-6">
          <h1 className="text-xl font-bold text-primary">إدارة التحفيظ</h1>
          <p className="text-sm text-muted-foreground mt-1">
            أهلاً، {user.name}
          </p>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <NavItems />
        </nav>
        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={logout}
          >
            <LogOut className="h-5 w-5 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card sticky top-0 z-10">
        <h1 className="text-lg font-bold text-primary">إدارة التحفيظ</h1>
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64 flex flex-col p-0">
            <div className="p-6 border-b border-border">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.role}</p>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-1">
              <NavItems />
            </nav>
            <div className="p-4 border-t border-border">
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive"
                onClick={() => {
                  logout();
                  setIsMobileOpen(false);
                }}
              >
                <LogOut className="h-5 w-5 ml-2" />
                خروج
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
      
      {/* Mobile Bottom Navigation (Optional for most used items) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card pb-safe z-10">
         <div className="flex justify-around items-center p-2">
            {navigation.slice(0, 4).map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <span className={`flex flex-col items-center p-2 cursor-pointer ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    <Icon className="h-6 w-6 mb-1" />
                    <span className="text-[10px]">{item.name}</span>
                  </span>
                </Link>
              )
            })}
         </div>
      </div>
    </div>
  );
}
