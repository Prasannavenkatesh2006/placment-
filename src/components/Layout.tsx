import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BarChart3, 
  Target, 
  LogOut, 
  Menu, 
  X,
  Bell,
  Search,
  User,
  BookOpen,
  LineChart,
  UserCircle
} from 'lucide-react';
import { Page, Role } from '../types';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  role: Role;
  onLogout: () => void;
  userName: string;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentPage, setCurrentPage, role, onLogout, userName, children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  const staffMenu = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Student Management', icon: Users },
    { id: 'tests', label: 'Test Management', icon: FileText },
    { id: 'results', label: 'Test Results', icon: BarChart3 },
    { id: 'company-analysis', label: 'Company Analysis', icon: Target },
  ];

  const studentMenu = [
    { id: 'student-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'student-tests', label: 'Test Portal', icon: BookOpen },
    { id: 'student-analytics', label: 'Performance', icon: LineChart },
    { id: 'student-profile', label: 'My Profile', icon: UserCircle },
  ];

  const menuItems = role === 'student' ? studentMenu : staffMenu;

  const handleLogoClick = () => {
    setCurrentPage(role === 'student' ? 'student-dashboard' : 'dashboard');
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex">
      {/* Spacer for Sidebar to prevent content jump */}
      <div className="hidden lg:block w-[80px] shrink-0" />

      {/* Sidebar - Desktop */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarExpanded ? 260 : 80 }}
        transition={{ type: "spring", stiffness: 300, damping: 35 }}
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
        className="hidden lg:flex flex-col border-r border-slate-200 bg-white fixed top-0 left-0 h-screen z-50 overflow-hidden shadow-2xl shadow-indigo-100/10"
      >
        <div className="p-6 h-full flex flex-col">
          <div 
            className="flex items-center gap-3 mb-10 h-8 overflow-hidden cursor-pointer"
            onClick={handleLogoClick}
          >
            <div className="min-w-8 w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-100 shrink-0">
               <span className="text-white font-bold text-xl leading-none">P</span>
            </div>
            <AnimatePresence>
               {isSidebarExpanded && (
                 <motion.h1 
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -10 }}
                   className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap"
                 >
                   PlacementOS
                 </motion.h1>
               )}
            </AnimatePresence>
          </div>
          
          <nav className="space-y-1 flex-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id as Page)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[0.875rem] font-medium transition-all group relative",
                  currentPage === item.id 
                    ? "bg-indigo-50 text-indigo-600" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon className={cn("min-w-4 w-4 h-4 shrink-0", currentPage === item.id ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600")} />
                <AnimatePresence duration={0.1}>
                  {isSidebarExpanded && (
                    <motion.span 
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      className="whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            ))}
          </nav>
          
          <div className="mt-auto border-t border-slate-100 pt-6">
            <Button variant="ghost" className="w-full justify-start gap-3 text-slate-500 hover:text-slate-900 px-3" onClick={onLogout}>
              <LogOut className="min-w-4 w-4 h-4 shrink-0" />
              <AnimatePresence>
                {isSidebarExpanded && (
                  <motion.span 
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    className="text-sm font-medium whitespace-nowrap"
                  >
                    Log Out
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>
      </motion.aside>

      {/* Sidebar - Mobile Drawer */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-white z-50 transform transition-transform duration-300 lg:hidden",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={handleLogoClick}
            >
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight">PlacementOS</h1>
            </div>
            <button onClick={() => setIsSidebarOpen(false)}>
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>
          
          <nav className="space-y-1 flex-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id as Page);
                  setIsSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-md font-medium transition-all",
                  currentPage === item.id 
                    ? "bg-indigo-50 text-indigo-600" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon className={cn("w-5 h-5", currentPage === item.id ? "text-indigo-600" : "text-slate-400")} />
                {item.label}
              </button>
            ))}
          </nav>

          <Button variant="ghost" className="w-full justify-start gap-3 mt-auto" onClick={onLogout}>
            <LogOut className="w-5 h-5 text-slate-400" />
            <span>Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-30 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <h1 
              className="text-lg font-bold text-slate-900 lg:hidden cursor-pointer"
              onClick={handleLogoClick}
            >
              PlacementOS
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 py-1.5 px-4 rounded-full text-[0.875rem] font-bold text-slate-900 group transition-all hover:bg-slate-100 cursor-pointer shadow-sm">
              <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center overflow-hidden">
                <User className="w-4 h-4 text-indigo-600" />
              </div>
              <span>{userName}</span>
            </div>
            {role === 'staff' && (
              <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors hidden sm:block">
                <Bell className="w-5 h-5" />
              </button>
            )}
          </div>
        </header>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 z-50 flex items-center justify-around px-4 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id as Page)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 transition-all",
                currentPage === item.id ? "text-indigo-600" : "text-slate-400"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label.split(' ')[0]}</span>
            </button>
          ))}
          <button 
             onClick={onLogout}
             className="flex flex-col items-center gap-1 p-2 text-slate-400"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Exit</span>
          </button>
        </nav>

        {/* Page Container */}
        <div className="flex-1 p-4 lg:p-8 max-w-[1700px] mx-auto w-full relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

