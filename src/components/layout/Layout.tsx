import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileSidebarDrawer from "./MobileSidebarDrawer";
import { MobileMenuProvider } from "./mobile-menu";

export default function Layout() {
  return (
    <MobileMenuProvider>
      <div className="flex h-screen overflow-hidden" style={{ background: "hsl(var(--background))" }}>
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <MobileSidebarDrawer />
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </MobileMenuProvider>
  );
}
