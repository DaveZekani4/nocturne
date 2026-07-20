import TopAppBar from "@/components/shared/TopAppBar";
import Footer from "@/components/shared/Footer";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <TopAppBar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
