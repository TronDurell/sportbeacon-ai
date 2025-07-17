import React from 'react';
import { Plus, Clock, MapPin } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  type: 'game' | 'practice' | 'meeting' | 'other';
  startTime: Date;
  endTime: Date;
  location: string;
  description: string;
}

const Calendar: React.FC = () => {
  const events: Event[] = [
    {
      id: '1',
      title: 'Team Practice',
      type: 'practice',
      startTime: new Date('2024-01-25T16:00:00'),
      endTime: new Date('2024-01-25T18:00:00'),
      location: 'Main Field',
      description: 'Regular team practice session'
    },
    {
      id: '2',
      title: 'Game vs Eagles',
      type: 'game',
      startTime: new Date('2024-01-27T14:00:00'),
      endTime: new Date('2024-01-27T16:00:00'),
      location: 'Stadium Complex',
      description: 'Home game against Eagles'
    },
    {
      id: '3',
      title: 'Team Meeting',
      type: 'meeting',
      startTime: new Date('2024-01-26T18:00:00'),
      endTime: new Date('2024-01-26T19:00:00'),
      location: 'Team Room',
      description: 'Weekly team strategy meeting'
    }
  ];

  const getEventTypeIcon = (type: Event['type']) => {
    switch (type) {
      case 'game': return '🏆';
      case 'practice': return '⚽';
      case 'meeting': return '📋';
      default: return '📅';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Calendar</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Event</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">January 2024</h3>
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-gray-100 rounded-md">
                  ←
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-md">
                  →
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
              
              {/* Calendar days would go here */}
              {Array.from({ length: 31 }, (_, i) => (
                <div
                  key={i + 1}
                  className="p-2 text-center text-sm border border-gray-200 min-h-[60px] hover:bg-gray-50 cursor-pointer"
                >
                  <span className="text-gray-900">{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
            <div className="space-y-4">
              {events.slice(0, 5).map((event) => (
                <div
                  key={event.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{getEventTypeIcon(event.type)}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 mb-1">{event.title}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(event.startTime)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Games</span>
                <span className="font-medium">{events.filter(e => e.type === 'game').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Practices</span>
                <span className="font-medium">{events.filter(e => e.type === 'practice').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Meetings</span>
                <span className="font-medium">{events.filter(e => e.type === 'meeting').length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar; 