import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { getCurrentUser, isSessionAuthenticated } from "@/api/authApi";
import { useActiveManagedProfile } from "@/hooks/useActiveManagedProfile";
import { getFirstAllowedMenuPath, type MenuAccessKey } from "@/data/menuAccess";
import GlobalTopLoader from "@/components/layout/GlobalTopLoader";
import Dashboard from "./pages/Dashboard";
import Activities from "./pages/Activities";
import ActivityDetail from "./pages/ActivityDetail";
import ModuleMenuPage from "./pages/ModuleMenuPage";
import Modules from "./pages/Modules";
import Incomes from "./pages/Incomes";
import Expenses from "./pages/Expenses";
import Categories from "./pages/Categories";
import Budgets from "./pages/Budgets";
import Loans from "./pages/Loans";
import Investments from "./pages/Investments";
import Settings from "./pages/Settings";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import SuperAdmin from "./pages/SuperAdmin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedLayout() {
  const location = useLocation();
  if (!isSessionAuthenticated()) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  }

  return <Layout />;
}

function PublicOnlyRoute() {
  if (isSessionAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

function MenuRoute({ menuKey, children }: { menuKey: MenuAccessKey; children: ReactNode }) {
  const currentUser = getCurrentUser();
  const isManagedProfile = Boolean(currentUser?.profileId);
  const { data: managedProfile, isLoading } = useActiveManagedProfile();

  if (!isManagedProfile) {
    return <>{children}</>;
  }

  if (isLoading) {
    return null;
  }

  const allowed = new Set(managedProfile?.menuAccess ?? []);
  if (allowed.has(menuKey)) {
    return <>{children}</>;
  }

  const redirectTo = managedProfile ? getFirstAllowedMenuPath(managedProfile.menuAccess) : "/";
  return <Navigate to={redirectTo} replace />;
}

function SuperAdminRoute({ children }: { children: ReactNode }) {
  const currentUser = getCurrentUser();
  const isSuperAdmin = currentUser?.role === "SUPERADMIN" && !currentUser?.profileId;
  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <GlobalTopLoader />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<MenuRoute menuKey="dashboard"><Dashboard /></MenuRoute>} />
            <Route path="/activities" element={<MenuRoute menuKey="activities"><Activities /></MenuRoute>} />
            <Route path="/modules" element={<MenuRoute menuKey="modules"><Modules /></MenuRoute>} />
            <Route path="/activities/:activityId" element={<MenuRoute menuKey="activities"><ActivityDetail /></MenuRoute>} />
            <Route path="/activities/:activityId/modules/:moduleId/:menuPath" element={<MenuRoute menuKey="activities"><ModuleMenuPage /></MenuRoute>} />
            <Route path="/incomes" element={<MenuRoute menuKey="incomes"><Incomes /></MenuRoute>} />
            <Route path="/expenses" element={<MenuRoute menuKey="expenses"><Expenses /></MenuRoute>} />
            <Route path="/categories" element={<MenuRoute menuKey="categories"><Categories /></MenuRoute>} />
            <Route path="/budgets" element={<MenuRoute menuKey="budgets"><Budgets /></MenuRoute>} />
            <Route path="/loans" element={<MenuRoute menuKey="loans"><Loans /></MenuRoute>} />
            <Route path="/investments" element={<MenuRoute menuKey="investments"><Investments /></MenuRoute>} />
            <Route path="/settings" element={<MenuRoute menuKey="settings"><Settings /></MenuRoute>} />
            <Route path="/superadmin" element={<SuperAdminRoute><SuperAdmin /></SuperAdminRoute>} />
          </Route>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
