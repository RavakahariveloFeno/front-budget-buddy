import { Sheet, SheetContent } from "@/components/ui/sheet";
import Sidebar from "./Sidebar";
import { useMobileMenu } from "./mobile-menu";

export default function MobileSidebarDrawer() {
  const { open, setOpen, close } = useMobileMenu();

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[240px] p-0">
          <Sidebar mode="drawer" onNavigate={close} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

