import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

import PatientProtectedRoute from "./components/auth/PatientProtectedRoute";
import StaffProtectedRoute from "./components/auth/StaffProtectedRoute";

// Pages
import PortalSelect from "./pages/PortalSelect";
import Index from "./pages/Index";
import Patients from "./pages/Patients";
import Doctors from "./pages/Doctors";
import Appointments from "./pages/Appointments";
import Departments from "./pages/Departments";
import Beds from "./pages/Beds";
import Callbacks from "./pages/Callbacks";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import ComingSoon from "./pages/ComingSoon";

// Patient pages
import PatientLogin from "./pages/patient/PatientLogin";
import PatientRegister from "./pages/patient/PatientRegister";
import PatientDashboard from "./pages/patient/PatientDashboard";

// Staff pages
import StaffLogin from "./pages/staff/StaffLogin";
import StaffRegister from "./pages/staff/StaffRegister";
import StaffPending from "./pages/staff/StaffPending";
import StaffApprovals from "./pages/staff/StaffApprovals";

// Admin pages
import AdminLogin from "./pages/admin/AdminLogin";

import MayaChatbot from "./components/chatbot/MayaChatbot";

// Staff Dashboards
import DoctorDashboard from "./pages/staff/DoctorDashboard";
import ReceptionDashboard from "./pages/staff/ReceptionDashboard";
import NurseDashboard from "./pages/staff/NurseDashboard";
import NurseRounds from "./pages/staff/NurseRounds";
import CashierDashboard from "./pages/staff/CashierDashboard";
import AdminAITools from "./pages/admin/AdminAITools";
import AdminInfo from "./pages/admin/AdminInfo";
import Salaries from "./pages/staff/Salaries";

const queryClient = new QueryClient();

import { ThemeProvider } from "./components/theme-provider";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Portal Selection */}
              <Route path="/" element={<PortalSelect />} />

              {/* Patient Routes */}
              <Route path="/patient/login" element={<PatientLogin />} />
              <Route path="/patient/register" element={<PatientRegister />} />
              <Route
                path="/patient/dashboard"
                element={
                  <PatientProtectedRoute>
                    <PatientDashboard />
                  </PatientProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Staff Routes */}
              <Route path="/staff/login" element={<StaffLogin />} />
              <Route path="/staff/register" element={<StaffRegister />} />
              <Route path="/staff/pending" element={<StaffPending />} />

              {/* Staff Dashboard (Protected) */}
              <Route
                path="/dashboard"
                element={
                  <StaffProtectedRoute>
                    <Index />
                  </StaffProtectedRoute>
                }
              />
              <Route
                path="/staff/dashboard/doctor"
                element={
                  <StaffProtectedRoute>
                    <DoctorDashboard />
                  </StaffProtectedRoute>
                }
              />
              <Route
                path="/staff/dashboard/reception"
                element={
                  <StaffProtectedRoute>
                    <ReceptionDashboard />
                  </StaffProtectedRoute>
                }
              />
              <Route
                path="/staff/dashboard/nurse"
                element={
                  <StaffProtectedRoute>
                    <NurseDashboard />
                  </StaffProtectedRoute>
                }
              />
              <Route
                path="/staff/dashboard/cashier"
                element={
                  <StaffProtectedRoute>
                    <CashierDashboard />
                  </StaffProtectedRoute>
                }
              />
              <Route
                path="/admin/ai-tools"
                element={
                  <StaffProtectedRoute requiredRole="admin">
                    <AdminAITools />
                  </StaffProtectedRoute>
                }
              />
              <Route
                path="/cashier/calculations"
                element={
                  <StaffProtectedRoute>
                    <CashierDashboard />
                  </StaffProtectedRoute>
                }
              />
              <Route
                path="/admin/info"
                element={
                  <StaffProtectedRoute requiredRole="admin">
                    <AdminInfo />
                  </StaffProtectedRoute>
                }
              />
              <Route
                path="/nurse/rounds"
                element={
                  <StaffProtectedRoute>
                    <NurseRounds />
                  </StaffProtectedRoute>
                }
              />
              <Route
                path="/patients"
                element={
                  <StaffProtectedRoute>
                    <Patients />
                  </StaffProtectedRoute>
                }
              />
              <Route
                path="/salaries"
                element={
                  <StaffProtectedRoute requiredRole="admin">
                    <Salaries />
                  </StaffProtectedRoute>
                }
              />
              <Route
                path="/doctors"
                element={
                  <StaffProtectedRoute>
                    <Doctors />
                  </StaffProtectedRoute>
                }
              />
              <Route
                path="/appointments"
                element={
                  <StaffProtectedRoute>
                    <Appointments />
                  </StaffProtectedRoute>
                }
              />
              <Route
                path="/departments"
                element={
                  <StaffProtectedRoute>
                    <Departments />
                  </StaffProtectedRoute>
                }
              />
              <Route
                path="/beds"
                element={
                  <StaffProtectedRoute>
                    <Beds />
                  </StaffProtectedRoute>
                }
              />
              <Route
                path="/callbacks"
                element={
                  <StaffProtectedRoute>
                    <Callbacks />
                  </StaffProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <StaffProtectedRoute>
                    <Reports />
                  </StaffProtectedRoute>
                }
              />
              <Route
                path="/staff/approvals"
                element={
                  <StaffProtectedRoute requiredRole="admin">
                    <StaffApprovals />
                  </StaffProtectedRoute>
                }
              />
              <Route
                path="/staff-approvals"
                element={
                  <StaffProtectedRoute requiredRole="admin">
                    <StaffApprovals />
                  </StaffProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <StaffProtectedRoute>
                    <Settings />
                  </StaffProtectedRoute>
                }
              />

              {/* Legacy routes redirect */}
              <Route path="/login" element={<PortalSelect />} />
              <Route path="/register" element={<PortalSelect />} />

              {/* Catch-all */}
              <Route path="/social-coming-soon" element={<ComingSoon />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <MayaChatbot />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
