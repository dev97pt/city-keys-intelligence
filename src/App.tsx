import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import Dashboard from "./pages/dashboard/Dashboard";
import CityPapers from "./pages/dashboard/CityPapers";
import NeighborhoodIntel from "./pages/dashboard/NeighborhoodIntel";
import Experiences from "./pages/dashboard/Experiences";
import Community from "./pages/dashboard/Community";
import DealCalculators from "./pages/dashboard/DealCalculators";
import AIAssistant from "./pages/dashboard/AIAssistant";
import AdminPanel from "./pages/dashboard/AdminPanel";
import ComingSoon from "./pages/dashboard/ComingSoon";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="city-papers" element={<CityPapers />} />
              <Route path="neighborhood-intel" element={<NeighborhoodIntel />} />
              <Route path="experiences" element={<Experiences />} />
              <Route path="community" element={<Community />} />
              <Route path="calculators" element={<DealCalculators />} />
              <Route path="ai-assistant" element={<AIAssistant />} />
              <Route path="admin" element={<AdminPanel />} />
              <Route path="webinars" element={<ComingSoon />} />
              <Route path="partners" element={<ComingSoon />} />
              <Route path="templates" element={<ComingSoon />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
