import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import InlineTooltip from '../InlineTooltip';
import ConflictRationaleBanner from '../ConflictRationaleBanner';

interface Facility {
  id: string;
  name: string;
  type: 'field' | 'court' | 'gym' | 'pool' | 'trail';
  sport_tags: string[];
  coordinates: { lat: number; lng: number };
  capacity: number;
  amenities: string[];
  open_hours: {
    start: string;
    end: string;
  };
  hourly_rate: number;
  maintenance_schedule: string[];
}

interface Booking {
  id: string;
  facility_id: string;
  coach_id: string;
  team_id: string;
  sport: string;
  start_time: Date;
  end_time: Date;
  participants: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  created_at: Date;
  updated_at: Date;
  conflict_resolved?: boolean;
  waitlist_position?: number;
}

interface BookingConflict {
  booking_id: string;
  facility_id: string;
  conflict_type: 'time_overlap' | 'capacity_exceeded' | 'maintenance' | 'coach_unavailable';
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggested_alternatives: string[];
  resolution_status: 'pending' | 'resolved' | 'ignored';
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  facility: string;
  coach: string;
  team: string;
  sport: string;
  status: string;
  color: string;
}

// Add OpenAI function calling stub for reschedule suggestions
async function suggestRescheduleSlots(conflict, teamAvailability) {
  // In real implementation, call OpenAI function or backend endpoint
  // For demo, return mock slots
  return [
    'Tomorrow 6pm',
    'Friday 4pm',
    'Saturday 10am'
  ];
}

export const FacilityBookingCalendar: React.FC = () => {
  const { user } = useAuth();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [conflicts, setConflicts] = useState<BookingConflict[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedFacility, setSelectedFacility] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [conflictBanner, setConflictBanner] = useState<string | null>(null);
  const [recurring, setRecurring] = useState(false);
  const [draggedBooking, setDraggedBooking] = useState<Booking | null>(null);
  const [rescheduleSuggestions, setRescheduleSuggestions] = useState<string[]>([]);

  // Load facilities and bookings
  useEffect(() => {
    loadFacilities();
    loadBookings();
  }, []);

  // Generate calendar events from bookings
  useEffect(() => {
    generateCalendarEvents();
  }, [bookings, facilities]);

  const loadFacilities = async () => {
    try {
      const facilitiesRef = collection(db, 'facilities');
      const facilitiesSnapshot = await getDocs(facilitiesRef);
      const facilitiesData = facilitiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Facility[];
      setFacilities(facilitiesData);
    } catch (err) {
      console.error('Error loading facilities:', err);
      setError('Failed to load facilities');
    }
  };

  const loadBookings = async () => {
    try {
      const bookingsRef = collection(db, 'bookings');
      const bookingsSnapshot = await getDocs(bookingsRef);
      const bookingsData = bookingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        start_time: doc.data().start_time.toDate(),
        end_time: doc.data().end_time.toDate(),
        created_at: doc.data().created_at.toDate(),
        updated_at: doc.data().updated_at.toDate()
      })) as Booking[];
      setBookings(bookingsData);
    } catch (err) {
      console.error('Error loading bookings:', err);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const generateCalendarEvents = () => {
    const events: CalendarEvent[] = bookings.map(booking => {
      const facility = facilities.find(f => f.id === booking.facility_id);
      const statusColors = {
        pending: '#f59e0b',
        confirmed: '#10b981',
        cancelled: '#ef4444',
        completed: '#6b7280'
      };

      return {
        id: booking.id,
        title: `${booking.team_id} - ${booking.sport}`,
        start: booking.start_time,
        end: booking.end_time,
        facility: facility?.name || 'Unknown',
        coach: booking.coach_id,
        team: booking.team_id,
        sport: booking.sport,
        status: booking.status,
        color: statusColors[booking.status] || '#6b7280'
      };
    });

    setCalendarEvents(events);
  };

  const checkForConflicts = useCallback((newBooking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) => {
    const conflicts: BookingConflict[] = [];

    // Check for time overlaps
    const overlappingBookings = bookings.filter(booking => 
      booking.facility_id === newBooking.facility_id &&
      booking.status !== 'cancelled' &&
      (
        (newBooking.start_time < booking.end_time && newBooking.end_time > booking.start_time) ||
        (booking.start_time < newBooking.end_time && booking.end_time > newBooking.start_time)
      )
    );

    if (overlappingBookings.length > 0) {
      conflicts.push({
        booking_id: newBooking.id || 'new',
        facility_id: newBooking.facility_id,
        conflict_type: 'time_overlap',
        severity: 'high',
        suggested_alternatives: getSuggestedAlternatives(newBooking),
        resolution_status: 'pending'
      });
    }

    // Check capacity
    const facility = facilities.find(f => f.id === newBooking.facility_id);
    if (facility && newBooking.participants > facility.capacity) {
      conflicts.push({
        booking_id: newBooking.id || 'new',
        facility_id: newBooking.facility_id,
        conflict_type: 'capacity_exceeded',
        severity: 'medium',
        suggested_alternatives: getSuggestedAlternatives(newBooking),
        resolution_status: 'pending'
      });
    }

    // Check maintenance schedule
    if (facility && isMaintenanceScheduled(facility, newBooking.start_time)) {
      conflicts.push({
        booking_id: newBooking.id || 'new',
        facility_id: newBooking.facility_id,
        conflict_type: 'maintenance',
        severity: 'critical',
        suggested_alternatives: getSuggestedAlternatives(newBooking),
        resolution_status: 'pending'
      });
    }

    return conflicts;
  }, [bookings, facilities]);

  const getSuggestedAlternatives = (booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) => {
    const alternatives: string[] = [];
    
    // Find available facilities for the same sport
    const availableFacilities = facilities.filter(facility => 
      facility.sport_tags.includes(booking.sport) &&
      facility.id !== booking.facility_id
    );

    // Find available time slots
    const availableSlots = findAvailableTimeSlots(booking.facility_id, booking.start_time, booking.end_time);

    alternatives.push(...availableFacilities.map(f => f.name));
    alternatives.push(...availableSlots.map(slot => `${slot.start} - ${slot.end}`));

    return alternatives.slice(0, 5); // Limit to 5 suggestions
  };

  const findAvailableTimeSlots = (facilityId: string, startTime: Date, endTime: Date) => {
    const slots: { start: string; end: string }[] = [];
    const facility = facilities.find(f => f.id === facilityId);
    
    if (!facility) return slots;

    // Generate time slots around the requested time
    const baseTime = new Date(startTime);
    const duration = endTime.getTime() - startTime.getTime();

    // Check slots before and after the requested time
    for (let i = -2; i <= 2; i++) {
      const slotStart = new Date(baseTime.getTime() + (i * 60 * 60 * 1000)); // ±2 hours
      const slotEnd = new Date(slotStart.getTime() + duration);

      // Check if this slot is available
      const hasConflict = bookings.some(booking =>
        booking.facility_id === facilityId &&
        booking.status !== 'cancelled' &&
        booking.start_time < slotEnd &&
        booking.end_time > slotStart
      );

      if (!hasConflict) {
        slots.push({
          start: slotStart.toLocaleTimeString(),
          end: slotEnd.toLocaleTimeString()
        });
      }
    }

    return slots;
  };

  const isMaintenanceScheduled = (facility: Facility, date: Date) => {
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'lowercase' });
    return facility.maintenance_schedule.includes(dayOfWeek);
  };

  const createBooking = async (bookingData: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Check for conflicts first
      const conflicts = checkForConflicts(bookingData);
      
      if (conflicts.length > 0) {
        setConflicts(conflicts);
        setShowConflictModal(true);
        return { success: false, conflicts };
      }

      // Create the booking
      const newBooking = {
        ...bookingData,
        created_at: new Date(),
        updated_at: new Date()
      };

      const bookingRef = await addDoc(collection(db, 'bookings'), newBooking);
      
      // Add to local state
      setBookings(prev => [...prev, { ...newBooking, id: bookingRef.id }]);
      
      // Send confirmation email
      await sendBookingConfirmation(newBooking);
      
      setConflictBanner(null);
      return { success: true, bookingId: bookingRef.id };
    } catch (err: any) {
      if (err?.message?.includes('conflict')) {
        setConflictBanner('Conflict due to prior reservation. Consider changing time or field.');
      } else {
        setConflictBanner('Booking failed. Please try again.');
      }
      console.error('Error creating booking:', err);
      setError('Failed to create booking');
      return { success: false, error: err };
    }
  };

  const updateBooking = async (bookingId: string, updates: Partial<Booking>) => {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        ...updates,
        updated_at: new Date()
      });

      // Update local state
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, ...updates, updated_at: new Date() }
          : booking
      ));

      return { success: true };
    } catch (err) {
      console.error('Error updating booking:', err);
      setError('Failed to update booking');
      return { success: false, error: err };
    }
  };

  const cancelBooking = async (bookingId: string, reason?: string) => {
    try {
      await updateBooking(bookingId, { 
        status: 'cancelled',
        notes: reason ? `${reason} - Cancelled on ${new Date().toLocaleDateString()}` : undefined
      });

      // Send cancellation notification
      await sendCancellationNotification(bookingId, reason);

      return { success: true };
    } catch (err) {
      console.error('Error cancelling booking:', err);
      return { success: false, error: err };
    }
  };

  const sendBookingConfirmation = async (booking: Booking) => {
    // Implementation for sending confirmation email
    console.log('Sending booking confirmation for:', booking.id);
  };

  const sendCancellationNotification = async (bookingId: string, reason?: string) => {
    // Implementation for sending cancellation notification
    console.log('Sending cancellation notification for:', bookingId, reason);
  };

  const exportCalendar = async (format: 'ics' | 'csv' | 'pdf') => {
    try {
      const response = await fetch(`/api/calendar/export?format=${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: calendarEvents })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cary-parks-calendar.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error exporting calendar:', err);
      setError('Failed to export calendar');
    }
  };

  const syncWithGoogleCalendar = async () => {
    try {
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: calendarEvents })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Calendar synced:', result);
      }
    } catch (err) {
      console.error('Error syncing calendar:', err);
      setError('Failed to sync with Google Calendar');
    }
  };

  // Drag & drop handlers (stub)
  const handleDragStart = (booking: Booking) => setDraggedBooking(booking);
  const handleDrop = async (date: Date) => {
    if (draggedBooking) {
      // In real implementation, update booking date/time
      setDraggedBooking(null);
      // Show success or conflict
    }
  };

  // Recurring booking handler (stub)
  const handleCreateRecurring = async (bookingData, recurrenceRule) => {
    // In real implementation, create multiple bookings based on rule
    // For demo, just log
    console.log('Create recurring booking:', bookingData, recurrenceRule);
  };

  // On booking conflict, suggest reschedule slots
  const handleBookingConflict = async (conflict) => {
    const suggestions = await suggestRescheduleSlots(conflict, /* teamAvailability */ []);
    setRescheduleSuggestions(suggestions);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Loading facility calendar...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Cary Parks & Rec - Facility Booking Calendar
              <InlineTooltip title="Only Admins and Coaches can access this section." />
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button onClick={() => setShowBookingModal(true)} disabled={!['admin','coach'].includes(user?.role)}>
                <Plus className="w-4 h-4 mr-2" />
                New Booking
                {!['admin','coach'].includes(user?.role) && (
                  <InlineTooltip title="Only Admins and Coaches can create bookings." />
                )}
              </Button>
              <Button variant="outline" onClick={() => syncWithGoogleCalendar()}>
                <Upload className="w-4 h-4 mr-2" />
                Sync Calendar
              </Button>
              <Button variant="outline" onClick={() => exportCalendar('ics')}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Booking Conflict Rationale Banner */}
      {conflictBanner && (
        <ConflictRationaleBanner message={conflictBanner} onClose={() => setConflictBanner(null)} />
      )}

      {/* Main Calendar Interface */}
      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center font-semibold text-gray-600">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {Array.from({ length: 35 }, (_, i) => {
                  const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
                  date.setDate(date.getDate() + i - date.getDay());
                  
                  const dayEvents = calendarEvents.filter(event => 
                    event.start.toDateString() === date.toDateString()
                  );

                  return (
                    <div
                      key={i}
                      className={`p-2 min-h-[100px] border border-gray-200 ${
                        date.toDateString() === new Date().toDateString() ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="text-sm font-medium mb-1">
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map(event => (
                          <div
                            key={event.id}
                            className="text-xs p-1 rounded"
                            style={{ backgroundColor: event.color, color: 'white' }}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {bookings.map(booking => {
                  const facility = facilities.find(f => f.id === booking.facility_id);
                  return (
                    <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-semibold">{booking.team_id}</h3>
                          <p className="text-sm text-gray-600">{booking.sport}</p>
                        </div>
                        <div>
                          <p className="text-sm">
                            {booking.start_time.toLocaleDateString()} {booking.start_time.toLocaleTimeString()}
                          </p>
                          <p className="text-sm text-gray-600">{facility?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                          {booking.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelBooking(booking.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conflicts" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {conflicts.map(conflict => (
                  <div key={conflict.booking_id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Booking Conflict</h3>
                      <Badge variant={conflict.severity === 'critical' ? 'destructive' : 'secondary'}>
                        {conflict.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {conflict.conflict_type.replace('_', ' ')}
                    </p>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Suggested Alternatives:</h4>
                      <ul className="text-sm text-gray-600">
                        {conflict.suggested_alternatives.map((alt, index) => (
                          <li key={index}>• {alt}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recurring booking toggle */}
      <div className="flex items-center gap-2 mb-2">
        <label>Recurring Booking:</label>
        <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} />
      </div>
      {/* Drag & drop and reschedule suggestions UI (stub) */}
      {rescheduleSuggestions.length > 0 && (
        <div className="p-2 bg-blue-50 rounded mb-2">
          <strong>Suggested Reschedule Slots:</strong>
          <ul>
            {rescheduleSuggestions.map((slot, idx) => <li key={idx}>{slot}</li>)}
          </ul>
        </div>
      )}

      {/* Booking Modal would go here */}
      {/* Conflict Resolution Modal would go here */}
    </div>
  );
}; 