import { Toaster } from "@/components/ui/toaster";
// import { Toaster as Sonner } from "@/components/ui/sonner"; // Temporarily commented out for debugging
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UserApps from "./pages/UserApps";
import CommunityTemplates from "./pages/CommunityTemplates";
import VibeCoder from "./pages/VibeCoder";
import MyProjects from "./pages/MyProjects";
import ProjectDetails from "./pages/ProjectDetails"; // Import the new ProjectDetails page
import { SessionContextProvider } from "./components/SessionContextProvider";
// import { ThemeProvider } from "@/components/theme-provider"; // Temporarily commented out for debugging

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      {/* <Sonner /> */} {/* Temporarily commented out for debugging */}
      <BrowserRouter>
        {/* <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme"> */} {/* Temporarily commented out for debugging */}
          <SessionContextProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/my-apps" element={<UserApps />} />
              <Route path="/community-templates" element={<CommunityTemplates />} />
              <Route path="/vibe-coder" element={<VibeCoder />} />
              <Route path="/my-projects" element={<MyProjects />} />
              <Route path="/my-projects/:projectId" element={<ProjectDetails />} /> {/* Add the ProjectDetails route */}
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SessionContextProvider>
        {/* </ThemeProvider> */} {/* Temporarily commented out for debugging */}
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;