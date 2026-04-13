import {
  LayoutDashboard,
  CalendarDays,
  BadgeCheck,
  BedDouble,
  ClipboardList,
  UtensilsCrossed,
  AlertTriangle,
} from "lucide-react";
import { ComponentType } from "react";

interface IRoute {
  path?: string;
  icon?: ComponentType<{ className?: string }>;
  name: string;
  routes?: IRoute[];
  checkActive?: (pathname: string, route: IRoute) => boolean;
  exact?: boolean;
}

export function routeIsActive(pathname: string, route: IRoute): boolean {
  if (route.checkActive) {
    return route.checkActive(pathname, route);
  }

  if (!route.path) return false;

  if (route.exact) {
    return pathname === route.path;
  }

  return pathname === route.path || pathname.startsWith(`${route.path}/`);
}

const routes: IRoute[] = [
  {
    path: "/issam/dashboard",
    icon: LayoutDashboard,
    name: "Dashboard",
    exact: true,
  },
  {
    path: "/issam/events",
    icon: CalendarDays,
    name: "Events",
  },
  {
    path: "/issam/registration",
    icon: BadgeCheck,
    name: "Accreditation",
  },
  {
    path: "/issam/room-allocation",
    icon: BedDouble,
    name: "Room Allocation",
  },
  {
    path: "/issam/attendance",
    icon: ClipboardList,
    name: "Daily Attendance",
  },
  {
    path: "/issam/scanner",
    icon: UtensilsCrossed,
    name: "Meal Service",
  },
  {
    path: "incident-report",
    icon: AlertTriangle,
    name: "Incident Reporting",
  },
];

export type { IRoute };
export default routes;
