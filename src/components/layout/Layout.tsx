import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileSidebarDrawer from "./MobileSidebarDrawer";
import { MobileMenuProvider } from "./mobile-menu";
import { clearSessionToken } from "@/api/authApi";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Layout() {
  const navigate = useNavigate();
  const [disabledModalOpen, setDisabledModalOpen] = useState(false);
  const [disabledMessage, setDisabledMessage] = useState<string>(
    "Votre compte a été désactivé. Veuillez contacter l’administrateur.",
  );

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ message?: string }>;
      const message = custom.detail?.message?.trim();
      setDisabledMessage(message || "Votre compte a été désactivé. Veuillez contacter l’administrateur.");
      setDisabledModalOpen(true);
    };

    window.addEventListener("bb:account-disabled", handler as EventListener);
    return () => window.removeEventListener("bb:account-disabled", handler as EventListener);
  }, []);

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

      <AlertDialog open={disabledModalOpen}>
        <AlertDialogContent className="border-border" style={{ background: "hsl(225, 27%, 10%)" }}>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display" style={{ color: "hsl(var(--foreground))" }}>
              Accès refusé
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: "hsl(var(--muted-foreground))" }}>
              {disabledMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                clearSessionToken();
                setDisabledModalOpen(false);
                navigate("/signin", { replace: true });
              }}
              className="border-0"
              style={{ background: "var(--gradient-danger)", color: "hsl(var(--destructive-foreground))" }}
            >
              Se déconnecter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MobileMenuProvider>
  );
}
