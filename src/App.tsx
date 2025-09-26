import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ScannerView from "./pages/ScannerView";
import StaffScannerView from "./pages/StaffScannerView";
import TicketDetailView from "./pages/TicketDetailView";
import AttendeeView from "./pages/AttendeeView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Login page as root */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Staff routes */}
          <Route path="/scanner" element={<StaffScannerView />} />
          <Route path="/staff-scanner" element={<ScannerView />} /> {/* Keep old one for compatibility */}
          
          {/* Client routes */}
          <Route path="/attendee" element={<AttendeeView />} />
          <Route path="/ticket/:id" element={<TicketDetailView />} />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;