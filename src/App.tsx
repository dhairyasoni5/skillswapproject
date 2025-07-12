import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Browse from "./pages/Browse";
import Profile from "./pages/Profile";
import Requests from "./pages/Requests";
import RequestSwap from "./pages/RequestSwap";
import Admin from "./pages/Admin";
import Banned from "./pages/Banned";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/request/:profileId" element={<RequestSwap />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/banned" element={<Banned />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
