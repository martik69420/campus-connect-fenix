
import * as React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import Navbar from "./Navbar";
import MobileNavBar from "./MobileNavBar";
import { useAuth } from "@/context/auth";
import { Toaster } from "@/components/ui/toaster";
import { AnimatePresence, motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const AppLayout = ({ children }: { children?: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  React.useEffect(() => {
    // Only redirect if we're sure the user is not authenticated and auth is not still loading
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-lg font-medium">Loading your experience...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render layout
  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex flex-1 min-h-0">
        {!isMobile && <Sidebar />}
        <div className={`flex-1 flex flex-col min-h-0 ${!isMobile ? "ml-64" : ""}`}> 
          <div className="sticky top-0 z-40 w-full">
            {!isMobile ? <TopBar /> : <Navbar />}
          </div>
          <main className="flex-1 container mx-auto py-3 md:py-6 pb-16 md:pb-6">
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {children || <Outlet />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
      {isMobile && <MobileNavBar />}
      <Toaster />
    </div>
  );
};

export default AppLayout;
