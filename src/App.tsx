import { Toaster as Sonner } from "sonner"; // Use Sonner for toasts
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UserApps from "./pages/UserApps";
import CommunityTemplates from "./pages/CommunityTemplates";
import VibeCoder from "./pages/VibeCoder";
import Studio from "./pages/Studio";
import MyProjects from "./pages/MyProjects";
import ProjectDetails from "./pages/ProjectDetails";
import TermsOfService from "./pages/TermsOfService";
import SharePreview from "./pages/SharePreview";
import { SessionContextProvider } from "./components/SessionContextProvider";
import { ThemeProvider } from "@/components/theme-provider"; // Re-enabled ThemeProvider
import HeaderNav from "@/components/HeaderNav";
import AIHub from "./pages/AIHub";
import Credits from "./pages/Credits";
import AdminDashboard from "./pages/AdminDashboard";
import Settings from "./pages/Settings";
import ProfileSettings from "./pages/ProfileSettings";
import ResetPassword from "./pages/ResetPassword";
import AuthDiagnostics from "./pages/AuthDiagnostics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner /> {/* Use Sonner here */}
      <BrowserRouter>
        <ThemeProvider attribute="class" defaultTheme="family-guy" storageKey="vite-ui-theme">
          <SessionContextProvider>
            {/* App Header */}
            <HeaderNav />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/my-apps" element={<UserApps />} />
              <Route path="/community-templates" element={<CommunityTemplates />} />
              <Route path="/vibe-coder" element={<VibeCoder />} />
              <Route path="/ai-hub" element={<AIHub />} />
              <Route path="/studio" element={<Studio />} />
              <Route path="/my-projects" element={<MyProjects />} />
              <Route path="/my-projects/:projectId" element={<ProjectDetails />} />
              <Route path="/credits" element={<Credits />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile-settings" element={<ProfileSettings />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth-diagnostics" element={<AuthDiagnostics />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/share/:id" element={<SharePreview />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
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
