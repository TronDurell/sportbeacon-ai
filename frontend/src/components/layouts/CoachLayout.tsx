import React from 'react';
import { 
  Home, 
  Calendar as CalendarIcon, 
  MessageSquare, 
  Users, 
  Target, 
  FileText, 
  BarChart3, 
  Settings as SettingsIcon,
  Trophy
} from 'lucide-react';
import BaseLayout from './BaseLayout';
import Dashboard from '../modules/Dashboard';
import Calendar from '../modules/Calendar';
import Messages from '../modules/Messages';
import Teams from '../modules/Teams';
import Performance from '../modules/Performance';
import Drills from '../modules/Drills';
import Evaluations from '../modules/Evaluations';
import VideoAnalysis from '../modules/VideoAnalysis';
import Reports from '../modules/Reports';
import Settings from '../modules/Settings';
import { useAuth } from '../../contexts/AdminAuthContext';
import { useAgentOrchestration } from '../../contexts/AgentOrchestrationContext';

const CoachLayout: React.FC = () => {
  const { user } = useAuth();
  const { sendRequest } = useAgentOrchestration();

  const navigationItems = [
    { name: 'Dashboard', icon: Home, component: Dashboard },
    { name: 'Calendar', icon: CalendarIcon, component: Calendar },
    { name: 'Messages', icon: MessageSquare, component: Messages },
    { name: 'Teams', icon: Users, component: Teams },
    { name: 'Performance', icon: Target, component: Performance },
    { name: 'Drills', icon: Trophy, component: Drills },
    { name: 'Evaluations', icon: FileText, component: Evaluations },
    { name: 'Video Analysis', icon: BarChart3, component: VideoAnalysis },
    { name: 'Reports', icon: BarChart3, component: Reports },
    { name: 'Settings', icon: SettingsIcon, component: Settings }
  ];

  const [activeTab, setActiveTab] = React.useState('Dashboard');

  const handleTabChange = async (tabName: string) => {
    setActiveTab(tabName);
    
    await sendRequest({
      type: 'coach_navigation',
      tab: tabName,
      userId: user?.id
    });
  };

  const ActiveComponent = navigationItems.find(item => item.name === activeTab)?.component || Dashboard;

  const sidebarContent = (
    <nav className="space-y-2">
      {navigationItems.map((item) => (
        <button
          key={item.name}
          onClick={() => handleTabChange(item.name)}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors ${
            activeTab === item.name
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <item.icon className="w-5 h-5" />
          <span className="font-medium">{item.name}</span>
        </button>
      ))}
    </nav>
  );

  return (
    <BaseLayout sidebarContent={sidebarContent}>
      <ActiveComponent />
    </BaseLayout>
  );
};

export default CoachLayout; 