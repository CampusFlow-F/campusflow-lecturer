import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { Students } from "./pages/Students";
import { Timetable } from "./pages/Timetable";
import { Assignments } from "./pages/Assignments";
import { Consultations } from "./pages/Consultations";
import { Reports } from "./pages/Reports";
import { StudyMaterials } from "./pages/StudyMaterials";
import { Updates } from "./pages/Updates";
import { Profile } from "./pages/Profile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/students" element={<AppLayout><Students /></AppLayout>} />
          <Route path="/timetable" element={<AppLayout><Timetable /></AppLayout>} />
          <Route path="/assignments" element={<AppLayout><Assignments /></AppLayout>} />
          <Route path="/consultations" element={<AppLayout><Consultations /></AppLayout>} />
          <Route path="/reports" element={<AppLayout><Reports /></AppLayout>} />
          <Route path="/materials" element={<AppLayout><StudyMaterials /></AppLayout>} />
          <Route path="/updates" element={<AppLayout><Updates /></AppLayout>} />
          <Route path="/profile" element={<AppLayout><Profile /></AppLayout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
