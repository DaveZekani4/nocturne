import AdminNav from "@/components/admin/AdminNav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AdminNav />
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
