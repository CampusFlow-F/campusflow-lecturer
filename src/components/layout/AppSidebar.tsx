import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  MessageSquare,
  FileCheck,
  BookOpen,
  Bell,
  UserCircle,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Students", url: "/students", icon: Users },
  { title: "Timetable", url: "/timetable", icon: Calendar },
  { title: "Assignments", url: "/assignments", icon: FileText },
  { title: "Consultations", url: "/consultations", icon: MessageSquare },
  { title: "Reports", url: "/reports", icon: FileCheck },
  { title: "Study Materials", url: "/materials", icon: BookOpen },
  { title: "Updates", url: "/updates", icon: Bell },
  { title: "Profile", url: "/profile", icon: UserCircle },
];

export const AppSidebar = () => {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const { toast } = useToast();
  const collapsed = state === "collapsed";

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/auth");
    }
  };

  return (
    <Sidebar
      className={`${collapsed ? "w-14" : "w-64"} 
      bg-[hsl(var(--background))] 
      text-[hsl(var(--foreground))] 
      border-r border-[hsl(var(--border))]`}
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[hsl(var(--foreground))] font-semibold">
            Menu
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        [
                          "flex items-center gap-2 rounded-md px-3 py-2 font-medium transition-all duration-150",
                          isActive
                            ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                            : "hover:bg-[hsl(var(--primary))]/20 hover:text-[hsl(var(--primary))]",
                        ].join(" ")
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-[hsl(var(--foreground))] hover:bg-[hsl(var(--primary))]/20 hover:text-[hsl(var(--primary))]"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Logout</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};
