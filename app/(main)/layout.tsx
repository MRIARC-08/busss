import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { FloatingSOS } from "@/components/shared/FloatingSOS";
import { GuidedTour } from "@/components/shared/GuidedTour";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingSOS />
      <GuidedTour />
    </>
  );
}
