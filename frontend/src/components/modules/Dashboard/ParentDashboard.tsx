import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SmartTile from '../../SmartTile';
import { useAgentOrchestration } from '../../../contexts/AgentOrchestrationContext';
import { 
  Calendar, 
  Users, 
  CreditCard,
  BookOpen,
  Bell,
  Heart,
  Award
} from 'lucide-react';

interface ParentData {
  children?: Array<{
    id: string;
    name: string;
    age: number;
    team: string;
    role: string;
    nextEvent?: {
      title: string;
      date: string;
      location: string;
    };
  }>;
  upcomingEvents?: Array<{
    id: string;
    title: string;
    date: string;
    location: string;
    childName: string;
    type: 'game' | 'practice' | 'tournament' | 'meeting';
  }>;
  notifications?: Array<{
    id: string;
    title: string;
    message: string;
    date: string;
    type: 'update' | 'reminder' | 'achievement' | 'payment';
    read: boolean;
  }>;
  payments?: Array<{
    id: string;
    description: string;
    amount: number;
    dueDate: string;
    status: 'paid' | 'pending' | 'overdue';
  }>;
  aiRecommendations?: Array<{
    id: string;
    title: string;
    description: string;
    category: 'nutrition' | 'equipment' | 'support' | 'development';
  }>;
  familyStats?: {
    totalChildren: number;
    activePrograms: number;
    totalSpent: number;
    upcomingPayments: number;
  };
}

const ParentDashboard: React.FC = () => {
  const { sendRequest } = useAgentOrchestration();
  const [parentData, setParentData] = useState<ParentData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate data fetching
    const fetchParentData = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setParentData({
        children: [
          {
            id: '1',
            name: 'Alex Johnson',
            age: 12,
            team: 'U12 Thunder',
            role: 'Forward',
            nextEvent: {
              title: 'Team Practice',
              date: 'Tomorrow, 4:00 PM',
              location: 'Main Field'
            }
          },
          {
            id: '2',
            name: 'Sarah Johnson',
            age: 10,
            team: 'U10 Lightning',
            role: 'Midfielder',
            nextEvent: {
              title: 'Game vs Eagles',
              date: 'Saturday, 2:00 PM',
              location: 'Community Stadium'
            }
          }
        ],
        upcomingEvents: [
          {
            id: '1',
            title: 'Team Practice',
            date: 'Tomorrow, 4:00 PM',
            location: 'Main Field',
            childName: 'Alex Johnson',
            type: 'practice'
          },
          {
            id: '2',
            title: 'Game vs Eagles',
            date: 'Saturday, 2:00 PM',
            location: 'Community Stadium',
            childName: 'Sarah Johnson',
            type: 'game'
          },
          {
            id: '3',
            title: 'Parent Meeting',
            date: 'Next Tuesday, 7:00 PM',
            location: 'Club House',
            childName: 'Both',
            type: 'meeting'
          }
        ],
        notifications: [
          {
            id: '1',
            title: 'Alex scored a goal!',
            message: 'Great performance in today\'s practice',
            date: '2 hours ago',
            type: 'achievement',
            read: false
          },
          {
            id: '2',
            title: 'Payment reminder',
            message: 'Monthly fee due in 3 days',
            date: '1 day ago',
            type: 'payment',
            read: true
          },
          {
            id: '3',
            title: 'Schedule update',
            message: 'Next game rescheduled to Saturday',
            date: '2 days ago',
            type: 'update',
            read: false
          }
        ],
        payments: [
          {
            id: '1',
            description: 'Monthly fee - Alex',
            amount: 85,
            dueDate: 'Tomorrow',
            status: 'pending'
          },
          {
            id: '2',
            description: 'Tournament fee - Sarah',
            amount: 120,
            dueDate: 'Next week',
            status: 'pending'
          },
          {
            id: '3',
            description: 'Equipment fee - Alex',
            amount: 45,
            dueDate: 'Last week',
            status: 'paid'
          }
        ],
        aiRecommendations: [
          {
            id: '1',
            title: 'Nutrition for young athletes',
            description: 'Optimize your child\'s performance with proper nutrition',
            category: 'nutrition'
          },
          {
            id: '2',
            title: 'New cleats needed',
            description: 'Alex\'s current cleats are showing wear',
            category: 'equipment'
          },
          {
            id: '3',
            title: 'Skill development tips',
            description: 'Practice drills to improve passing accuracy',
            category: 'development'
          }
        ],
        familyStats: {
          totalChildren: 2,
          activePrograms: 3,
          totalSpent: 450,
          upcomingPayments: 205
        }
      });
      setLoading(false);
    };

    fetchParentData();
  }, []);

  const handleAIAssistance = (context: string) => {
    sendRequest({
      type: 'parent_assistance',
      context,
      data: parentData
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants} className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Family Dashboard</h1>
        <p className="text-gray-600">Supporting your young athletes' journey</p>
      </motion.div>

      {/* Family Stats Overview */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Children</p>
              <p className="text-2xl font-bold text-gray-900">{parentData.familyStats?.totalChildren || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Active Programs</p>
              <p className="text-2xl font-bold text-gray-900">{parentData.familyStats?.activePrograms || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">${parentData.familyStats?.totalSpent || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900">${parentData.familyStats?.upcomingPayments || 0}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Children Overview */}
        <motion.div variants={itemVariants}>
          <SmartTile
            title="My Children"
            icon={<Heart className="w-5 h-5" />}
            status="success"
            onClickAI={() => handleAIAssistance('children_overview')}
            loading={loading}
          >
            <div className="space-y-3">
              {parentData.children?.map((child) => (
                <div key={child.id} className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-blue-900">{child.name}</h4>
                    <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                      Age {child.age}
                    </span>
                  </div>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p><strong>Team:</strong> {child.team}</p>
                    <p><strong>Position:</strong> {child.role}</p>
                    {child.nextEvent && (
                      <div className="mt-2 p-2 bg-white rounded border">
                        <p className="text-xs font-medium text-gray-700">Next Event</p>
                        <p className="text-xs text-gray-600">{child.nextEvent.title}</p>
                        <p className="text-xs text-gray-500">{child.nextEvent.date}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SmartTile>
        </motion.div>

        {/* Upcoming Events */}
        <motion.div variants={itemVariants}>
          <SmartTile
            title="Upcoming Events"
            icon={<Calendar className="w-5 h-5" />}
            status="info"
            onClickAI={() => handleAIAssistance('upcoming_events')}
            loading={loading}
          >
            <div className="space-y-2">
              {parentData.upcomingEvents?.slice(0, 3).map((event) => (
                <div key={event.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-gray-900 text-sm">{event.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded ${
                      event.type === 'game' ? 'bg-red-100 text-red-700' :
                      event.type === 'practice' ? 'bg-blue-100 text-blue-700' :
                      event.type === 'tournament' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {event.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{event.date}</p>
                  <p className="text-xs text-gray-500">{event.location}</p>
                  <p className="text-xs text-gray-500 mt-1">For: {event.childName}</p>
                </div>
              ))}
            </div>
          </SmartTile>
        </motion.div>

        {/* Notifications */}
        <motion.div variants={itemVariants}>
          <SmartTile
            title="Notifications"
            icon={<Bell className="w-5 h-5" />}
            status={parentData.notifications?.some(n => !n.read) ? 'warning' : 'neutral'}
            onClickAI={() => handleAIAssistance('notifications')}
            loading={loading}
          >
            <div className="space-y-2">
              {parentData.notifications?.slice(0, 3).map((notification) => (
                <div key={notification.id} className={`p-3 rounded-lg ${
                  notification.read ? 'bg-gray-50' : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-gray-900 text-sm">{notification.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded ${
                      notification.type === 'achievement' ? 'bg-green-100 text-green-700' :
                      notification.type === 'payment' ? 'bg-blue-100 text-blue-700' :
                      notification.type === 'update' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {notification.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{notification.date}</p>
                </div>
              ))}
            </div>
          </SmartTile>
        </motion.div>

        {/* Payments */}
        <motion.div variants={itemVariants}>
          <SmartTile
            title="Payments"
            icon={<CreditCard className="w-5 h-5" />}
            status={parentData.payments?.some(p => p.status === 'overdue') ? 'error' : 'neutral'}
            onClickAI={() => handleAIAssistance('payments')}
            loading={loading}
          >
            <div className="space-y-2">
              {parentData.payments?.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{payment.description}</p>
                    <p className="text-xs text-gray-500">Due: {payment.dueDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">${payment.amount}</p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      payment.status === 'paid' ? 'bg-green-100 text-green-700' :
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </SmartTile>
        </motion.div>

        {/* AI Recommendations */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <SmartTile
            title="AI Recommendations"
            icon={<Award className="w-5 h-5" />}
            status="success"
            onClickAI={() => handleAIAssistance('recommendations')}
            loading={loading}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {parentData.aiRecommendations?.map((recommendation) => (
                <div key={recommendation.id} className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-green-900 text-sm">{recommendation.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded ${
                      recommendation.category === 'nutrition' ? 'bg-green-200 text-green-800' :
                      recommendation.category === 'equipment' ? 'bg-blue-200 text-blue-800' :
                      recommendation.category === 'support' ? 'bg-purple-200 text-purple-800' :
                      'bg-yellow-200 text-yellow-800'
                    }`}>
                      {recommendation.category}
                    </span>
                  </div>
                  <p className="text-xs text-green-700">{recommendation.description}</p>
                </div>
              ))}
            </div>
          </SmartTile>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ParentDashboard; 