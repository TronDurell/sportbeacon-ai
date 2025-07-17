import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AdminAuthContext';
import { useSmartLayer } from '../../contexts/SmartLayerContext';
import { 
  Menu, 
  X, 
  Bot, 
  Bell,
  Search
} from 'lucide-react';

interface BaseLayoutProps {
  children: ReactNode;
  sidebarContent?: ReactNode;
  headerContent?: ReactNode;
  className?: string;
}

const BaseLayout: React.FC<BaseLayoutProps> = ({ 
  children, 
  sidebarContent, 
  headerContent,
  className = '' 
}) => {
  const { user } = useAuth();
  const { sidebarCollapsed, toggleSidebar, isAIAssistantOpen, toggleAIAssistant } = useSmartLayer();

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SB</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">SportBeacon AI</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm w-48"
              />
            </div>

            {/* Notifications */}
            <button className="p-2 rounded-lg hover:bg-gray-100 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>

            {/* AI Assistant Toggle */}
            <button
              onClick={toggleAIAssistant}
              className={`p-2 rounded-lg transition-colors ${
                isAIAssistantOpen 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <Bot className="h-5 w-5" />
            </button>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role}
                </p>
              </div>
              
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.firstName?.charAt(0) || 'U'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Header Content */}
        {headerContent && (
          <div className="px-4 sm:px-6 lg:px-8 py-4 border-t">
            {headerContent}
          </div>
        )}
      </header>

      <div className="flex">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarContent && (
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className={`bg-white shadow-sm border-r ${
                sidebarCollapsed ? 'w-16' : 'w-64'
              } min-h-screen transition-all duration-300`}
            >
              <div className="p-4">
                {sidebarContent}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${
          sidebarContent ? (sidebarCollapsed ? 'ml-16' : 'ml-64') : ''
        }`}>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>

      {/* AI Assistant Panel */}
      <AnimatePresence>
        {isAIAssistantOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl border-l z-50"
          >
            <div className="flex flex-col h-full">
              {/* AI Assistant Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-blue-500" />
                  <h2 className="text-lg font-semibold">AI Assistant</h2>
                </div>
                <button
                  onClick={toggleAIAssistant}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* AI Assistant Content */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-2">How can I help you today?</h3>
                    <p className="text-sm text-blue-700">
                      I can help with scheduling, team management, performance analysis, and more.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      Schedule a game or practice
                    </button>
                    <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      Analyze team performance
                    </button>
                    <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      Send team notifications
                    </button>
                    <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      Generate reports
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BaseLayout; 