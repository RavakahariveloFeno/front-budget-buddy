import * as React from "react";

type MobileMenuContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  close: () => void;
};

const MobileMenuContext = React.createContext<MobileMenuContextValue | null>(null);

export function MobileMenuProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  const value = React.useMemo<MobileMenuContextValue>(
    () => ({
      open,
      setOpen,
      toggle: () => setOpen((prev) => !prev),
      close: () => setOpen(false),
    }),
    [open],
  );

  return <MobileMenuContext.Provider value={value}>{children}</MobileMenuContext.Provider>;
}

export function useMobileMenu(): MobileMenuContextValue {
  const context = React.useContext(MobileMenuContext);
  if (!context) {
    throw new Error("useMobileMenu must be used within a MobileMenuProvider");
  }
  return context;
}
