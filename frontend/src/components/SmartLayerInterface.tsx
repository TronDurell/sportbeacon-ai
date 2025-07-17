import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useSmartLayer } from '../contexts/SmartLayerContext';
import { useAuth } from '../contexts/AdminAuthContext';
import { useAgentOrchestration } from '../contexts/AgentOrchestrationContext';
import { 
  Users, 
  Trophy, 
  Settings, 
  MessageSquare, 
  Calendar, 
  BarChart3, 
  Shield,
  Bot,
  X
} from 'lucide-react';

interface SmartLayerInterfaceProps {
  className?: string;
}

const SmartLayerInterface: React.FC<SmartLayerInterfaceProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { isAIAssistantOpen, toggleAIAssistant } = useSmartLayer();
  const { startAgent } = useAgentOrchestration();

  const [activeTab, setActiveTab] = useState('dashboard');

  // Role-based tab configuration
  const getTabsForRole = (role: string) => {
    switch (role) {
      case 'player':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { id: 'schedule', label: 'Schedule', icon: Calendar },
          { id: 'messages', label: 'Messages', icon: MessageSquare },
          { id: 'achievements', label: 'Achievements', icon: Trophy }
        ];
      case 'coach':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { id: 'teams', label: 'Teams', icon: Users },
          { id: 'schedule', label: 'Schedule', icon: Calendar },
          { id: 'messages', label: 'Messages', icon: MessageSquare },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 }
        ];
      case 'parent':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { id: 'children', label: 'Children', icon: Users },
          { id: 'schedule', label: 'Schedule', icon: Calendar },
          { id: 'messages', label: 'Messages', icon: MessageSquare },
          { id: 'payments', label: 'Payments', icon: Shield }
        ];
      case 'admin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'leagues', label: 'Leagues', icon: Trophy },
          { id: 'settings', label: 'Settings', icon: Settings },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 }
        ];
      default:
        return [
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { id: 'schedule', label: 'Schedule', icon: Calendar },
          { id: 'messages', label: 'Messages', icon: MessageSquare }
        ];
    }
  };

  const tabs = getTabsForRole(user?.role || 'player');

  const renderTabContent = (tabId: string) => {
    switch (tabId) {
      case 'dashboard':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Welcome, {user?.firstName || 'User'}!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  This is your personalized dashboard. Here you can view your stats, upcoming events, and recent activity.
                </p>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Upcoming Events</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">3</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Unread Messages</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">5</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Achievements</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">12</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      
      case 'schedule':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                View and manage your upcoming games, practices, and events.
              </p>
            </CardContent>
          </Card>
        );
      
      case 'messages':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Communicate with coaches, teammates, and parents.
              </p>
            </CardContent>
          </Card>
        );
      
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>{tabId.charAt(0).toUpperCase() + tabId.slice(1)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Content for {tabId} tab is coming soon.
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">SportBeacon AI</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                onClick={toggleAIAssistant}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Bot className="h-4 w-4" />
                AI Assistant
              </Button>
              
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.firstName?.charAt(0) || 'U'}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Main Content Area */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              
              {tabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="mt-6">
                  {renderTabContent(tab.id)}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
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
                <Button
                  onClick={toggleAIAssistant}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* AI Assistant Content */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">How can I help you today?</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => startAgent('scheduler')}
                        >
                          Schedule a game or practice
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => startAgent('notifier')}
                        >
                          Send team notifications
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => startAgent('analyzer')}
                        >
                          Analyze team performance
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p>• Scheduled practice for tomorrow</p>
                        <p>• Sent reminder to team</p>
                        <p>• Updated player stats</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartLayerInterface; 