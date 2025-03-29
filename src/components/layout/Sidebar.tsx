
import React from "react";
import { NavLink } from "react-router-dom";
import { Home, User, Bell, MessageSquare, Users, Gamepad2, Award, BarChart3, Settings, PenSquare } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import OnlineStatus from "@/components/OnlineStatus";

const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: `/profile/${user?.username}`, icon: User, label: "Profile" },
    { path: "/messages", icon: MessageSquare, label: "Messages" },
    { path: "/notifications", icon: Bell, label: "Notifications" },
    { path: "/friends", icon: Users, label: "Friends" },
    { path: "/games", icon: Gamepad2, label: "Games" },
    { path: "/leaderboard", icon: Award, label: "Leaderboard" },
    { path: "/earn", icon: BarChart3, label: "Earn Coins" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  const sidebarVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { 
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1 }
  };

  return (
    <motion.aside 
      className="hidden md:flex flex-col w-20 bg-card border-r border-border h-screen sticky top-0 overflow-y-auto scrollbar-hidden"
      initial="hidden"
      animate="visible"
      variants={sidebarVariants}
    >
      <div className="flex flex-col items-center space-y-6 py-6">
        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-fenix text-white font-bold text-xl">
          F
        </div>
        
        <div className="flex flex-col items-center gap-6 pt-6">
          <TooltipProvider>
            {navItems.map((item) => (
              <motion.div key={item.path} variants={itemVariants}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) => cn(
                        "flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200",
                        isActive 
                          ? "bg-fenix/10 text-fenix shadow-sm" 
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            ))}
          </TooltipProvider>
        </div>
      </div>

      <div className="mt-auto mb-6 flex flex-col items-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <NavLink to={`/profile/${user?.username}`} className="transition-transform hover:scale-105">
                  <Avatar className="h-12 w-12 border-2 border-background">
                    <AvatarImage src={user?.avatar} alt={user?.displayName} />
                    <AvatarFallback className="bg-fenix text-white">
                      {user?.displayName ? user.displayName.split(' ').map(n => n[0]).join('') : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </NavLink>
                {user?.id && (
                  <div className="absolute -top-1 -right-1">
                    <OnlineStatus userId={user.id} showLabel={false} />
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <div className="text-sm font-medium">{user?.displayName}</div>
              <div className="text-xs text-muted-foreground">{user?.coins} coins</div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
