import { Toaster as Sonner } from "sonner"; // Use Sonner for toasts
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import React from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UserApps from "./pages/UserApps";
import Products from "./pages/Products";
import TermsOfService from "./pages/TermsOfService";
import SharePreview from "./pages/SharePreview";
import { SessionContextProvider } from "./components/SessionContextProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import { ThemeProvider } from "@/components/theme-provider"; // Re-enabled ThemeProvider
import HeaderNav from "@/components/HeaderNav";
import LoginBanner from "@/components/LoginBanner";
import Credits from "./pages/Credits";
import SystemControl from "./pages/SystemControl";
import Settings from "./pages/Settings";
import ProfileSettings from "./pages/ProfileSettings";
import ResetPassword from "./pages/ResetPassword";
import AuthDiagnostics from "./pages/AuthDiagnostics";
const CommunityTemplates = React.lazy(() => import("./pages/CommunityTemplates"));
const VibeCoder = React.lazy(() => import("./pages/VibeCoder"));
const Studio = React.lazy(() => import("./pages/Studio"));
const MyProjects = React.lazy(() => import("./pages/MyProjects"));
const ProjectDetails = React.lazy(() => import("./pages/ProjectDetails"));
const AIHub = React.lazy(() => import("./pages/AIHub"));
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner /> {/* Use Sonner here */}
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <ThemeProvider attribute="class" defaultTheme="nxe-ai" storageKey="vite-ui-theme" themes={["light","dark","black-green","family-guy","nxe-ai"]}>
          <SessionContextProvider>
            {/* App Header */}
            <HeaderNav />
            <LoginBanner />
            <React.Suspense fallback={<div className="p-4 text-foreground">Loading...</div>}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/my-apps" element={<ProtectedRoute><UserApps /></ProtectedRoute>} />
              <Route path="/community-templates" element={<ProtectedRoute><CommunityTemplates /></ProtectedRoute>} />
              <Route path="/vibe-coder" element={<ProtectedRoute><VibeCoder /></ProtectedRoute>} />
              <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
              <Route path="/ai-hub" element={<ProtectedRoute><AIHub /></ProtectedRoute>} />
              <Route path="/studio" element={<ProtectedRoute><Studio /></ProtectedRoute>} />
              <Route path="/my-projects" element={<ProtectedRoute><MyProjects /></ProtectedRoute>} />
              <Route path="/my-projects/:projectId" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
              <Route path="/credits" element={<ProtectedRoute><Credits /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/system-control" element={<ProtectedRoute><SystemControl /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/profile-settings" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth-diagnostics" element={<AuthDiagnostics />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/share/:id" element={<SharePreview />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </React.Suspense>
            {/* App Footer with quick links */}
            <footer className="w-full bg-accent text-accent-foreground mt-8">
              <div className="container mx-auto flex flex-col md:flex-row items-center justify-between py-4 px-4 gap-2">
                <p className="font-semibold tracking-wide">NXE AI © {new Date().getFullYear()}</p>
                <div className="flex items-center gap-4">
                  <Link to="/terms" className="hover:underline">Terms of Service</Link>
                  <a href="/" className="hover:underline">Privacy</a>
                  <a href="/" className="hover:underline">Contact</a>
                </div>
              </div>
            </footer>
          </SessionContextProvider>
        </ThemeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
