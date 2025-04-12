
import * as React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import Navbar from "./Navbar";
import { useAuth } from "@/context/auth";
import { Toaster } from "@/components/ui/toaster";
import { AnimatePresence, motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const AppLayout = ({ children }: { children?: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  React.useEffect(() => {
    // Add meta viewport tag to ensure proper mobile rendering
    const metaTag = document.createElement('meta');
    metaTag.name = 'viewport';
    metaTag.content = 'width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no';
    document.head.appendChild(metaTag);

    // Only redirect if we're sure the user is not authenticated and auth is not still loading
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }

    return () => {
      document.head.removeChild(metaTag);
    };
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 rounded-full border-3 border-primary border-t-transparent animate-spin"></div>
          <p className="text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render layout
  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background flex">
      {!isMobile && <Sidebar />}
      <div className={`flex-1 flex flex-col min-h-screen ${!isMobile ? "ml-64" : ""}`}> 
        <div className="safe-top">
          {!isMobile ? <TopBar /> : <Navbar />}
        </div>
        <main className="flex-1 container mx-auto py-4 px-4 md:px-6">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {children || <Outlet />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <Toaster />
    </div>
  );
};

export default AppLayout;
