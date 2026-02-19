import {
  HomeIcon,
  Squares2X2Icon,
  ChartBarIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

export const NAV_ITEMS = [
  { id: "home", label: "Home", Icon: HomeIcon },
  { id: "categories", label: "Categories", Icon: Squares2X2Icon },
  { id: "trends", label: "Trends", Icon: ChartBarIcon },
  { id: "profile", label: "Profile", Icon: UserCircleIcon },
];

export const ACTIVE_NAV_ID = "home";
