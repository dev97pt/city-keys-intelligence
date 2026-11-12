import { Link, useLocation } from "react-router-dom";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment } from "react";

const LABELS: Record<string, string> = {
  dashboard: "Dashboard", "city-papers": "City Papers", "neighborhood-intel": "Neighborhoods",
  experiences: "Experiences", community: "Community", calculators: "Deal Calculator",
  "ai-assistant": "AI Assistant", admin: "Admin", courses: "Courses", lesson: "Lesson",
  "learning-paths": "Learning Paths", "admin-courses": "Course Admin", partners: "Partners",
  templates: "Templates", settings: "Settings",
};

export function DashboardBreadcrumbs() {
  const { pathname } = useLocation();
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  const crumbs: { label: string; href: string }[] = [];
  parts.forEach((p, i) => {
    const href = "/" + parts.slice(0, i + 1).join("/");
    if (p === "lesson" || p === "learning-paths") return; // non-navigable segments
    const label = LABELS[p] ?? (parts[i - 1] === "lesson" ? "Lesson" : "Details");
    crumbs.push({ label, href });
  });

  return (
    <Breadcrumb className="ml-3 min-w-0">
      <BreadcrumbList className="flex-nowrap overflow-hidden">
        {crumbs.map((c, i) => (
          <Fragment key={c.href}>
            {i > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem className="truncate">
              {i === crumbs.length - 1 ? (
                <BreadcrumbPage>{c.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild><Link to={c.href}>{c.label}</Link></BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
