// app/admin/layout.js
import AdminSidebar from "@/components/admin/Sidebar";

export const metadata = {
  title: "Admin Panel - Qimat",
  description: "Manage prices, products, and settings",
};

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <AdminSidebar />
      <main className="lg:pl-72">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
