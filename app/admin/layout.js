// app/admin/layout.js
import AdminShell from "@/components/admin/AdminShell";

export const metadata = {
  title: "Admin Panel - Qimat",
  description: "Manage prices, products, and settings",
};

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
