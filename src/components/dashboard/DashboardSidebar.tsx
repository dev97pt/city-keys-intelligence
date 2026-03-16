import {
  LayoutDashboard,
  FileText,
  Video,
  BookOpen,
  Users,
  Calculator,
  CheckSquare,
  MapPin,
  Compass,
  LogOut,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/components/AuthProvider";
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

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "City Papers", url: "/dashboard/city-papers", icon: FileText },
  { title: "Neighborhood Intel", url: "/dashboard/neighborhood-intel", icon: MapPin },
];

const comingSoonItems = [
  { title: "Webinars", url: "/dashboard/webinars", icon: Video },
  { title: "Partner Directory", url: "/dashboard/partners", icon: BookOpen },
  { title: "Community", url: "/dashboard/community", icon: Users },
  { title: "Deal Calculators", url: "/dashboard/calculators", icon: Calculator },
  { title: "Templates", url: "/dashboard/templates", icon: CheckSquare },
  { title: "Experiences", url: "/dashboard/experiences", icon: Compass },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-3">
            {!collapsed && (
              <span className="font-serif text-base font-semibold text-foreground">
                <span className="text-primary">K</span>
                <span className="text-xs">tt</span>
                <span className="text-primary">C</span>
              </span>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{!collapsed && "Coming Soon"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {comingSoonItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="opacity-50 cursor-not-allowed hover:bg-transparent"
                      activeClassName=""
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && "Sign Out"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
