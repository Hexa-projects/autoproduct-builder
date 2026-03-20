import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useCartSync } from "@/hooks/useCartSync";
import { captureUTMs, trackPageView } from "@/lib/tracking";
import Index from "./pages/Index";
import ProductPage from "./pages/ProductPage";
import CatalogPage from "./pages/CatalogPage";
import ContactPage from "./pages/ContactPage";
import NotFound from "./pages/NotFound";
import AdminLayout from "./components/admin/AdminLayout";
import LoginPage from "./pages/admin/LoginPage";
import DashboardPage from "./pages/admin/DashboardPage";
import ProductsPage from "./pages/admin/ProductsPage";
import ProductFormPage from "./pages/admin/ProductFormPage";
import CategoriesPage from "./pages/admin/CategoriesPage";
import ImportPage from "./pages/admin/ImportPage";

const queryClient = new QueryClient();

function TrackingProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  useEffect(() => { captureUTMs(); }, []);
  useEffect(() => { trackPageView(); }, [location.pathname]);
  return <>{children}</>;
}

function AppContent() {
  useCartSync();
  return (
    <BrowserRouter>
      <TrackingProvider>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/products/:slug" element={<ProductPage />} />
        <Route path="/colecciones" element={<CatalogPage />} />
        <Route path="/colecciones/:handle" element={<CatalogPage />} />
        <Route path="/contacto" element={<ContactPage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductFormPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="import" element={<ImportPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      </TrackingProvider>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
