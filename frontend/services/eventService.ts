import { fetchWithAuth } from './api';

export interface Venue {
    id: string;
    name: string;
    address: string;
    capacity: number;
    facilities: string[];
    parkingSpots: number;
    parkingZones: {
        zone: string;
        capacity: number;
        availableSpots: number;
    }[];
    coordinates: {
        lat: number;
        lng: number;
    };
}

export interface EventPrediction {
    expectedAttendance: number;
    confidenceScore: number;
    weatherImpact: 'positive' | 'neutral' | 'negative';
    peakTimes: string[];
    recommendedStaffing: number;
}

export interface SportEvent {
    id: string;
    title: string;
    description: string;
    type: 'match' | 'training' | 'tournament' | 'tryout';
    sport: string;
    startDate: string;
    endDate: string;
    venue: Venue;
    teams: {
        id: string;
        name: string;
        logo?: string;
    }[];
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    maxParticipants: number;
    currentParticipants: number;
    prediction?: EventPrediction;
}

class EventService {
    async createEvent(eventData: Omit<SportEvent, 'id' | 'prediction'>): Promise<SportEvent> {
        const response = await fetchWithAuth('/api/events', {
            method: 'POST',
            body: JSON.stringify(eventData),
        });

        return response.json();
    }

    async getEvent(eventId: string): Promise<SportEvent> {
        const response = await fetchWithAuth(`/api/events/${eventId}`);
        return response.json();
    }

    async getEventsByTeam(teamId: string, params: {
        startDate?: string;
        endDate?: string;
        status?: SportEvent['status'];
    } = {}): Promise<SportEvent[]> {
        const queryParams = new URLSearchParams();
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        if (params.status) queryParams.append('status', params.status);

        const response = await fetchWithAuth(
            `/api/teams/${teamId}/events?${queryParams.toString()}`
        );
        return response.json();
    }

    async getVenueAvailability(venueId: string, date: string): Promise<{
        availableSlots: { start: string; end: string }[];
        blockedSlots: { start: string; end: string; reason: string }[];
    }> {
        const response = await fetchWithAuth(
            `/api/venues/${venueId}/availability?date=${date}`
        );
        return response.json();
    }

    async getParkingStatus(venueId: string, eventId: string): Promise<{
        totalSpots: number;
        availableSpots: number;
        zones: Venue['parkingZones'];
        nearbyAlternatives: {
            name: string;
            distance: number;
            availableSpots: number;
            walkingTime: number;
        }[];
    }> {
        const response = await fetchWithAuth(
            `/api/venues/${venueId}/events/${eventId}/parking`
        );
        return response.json();
    }

    async getAttendancePrediction(eventId: string): Promise<EventPrediction> {
        const response = await fetchWithAuth(`/api/events/${eventId}/prediction`);
        return response.json();
    }

    async updateEventStatus(
        eventId: string,
        status: SportEvent['status'],
        details?: { reason?: string; notification?: boolean }
    ): Promise<void> {
        await fetchWithAuth(`/api/events/${eventId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status, ...details }),
        });
    }

    async registerForEvent(eventId: string, playerId: string): Promise<{
        registered: boolean;
        position: number;
        waitlisted: boolean;
    }> {
        const response = await fetchWithAuth(`/api/events/${eventId}/register`, {
            method: 'POST',
            body: JSON.stringify({ playerId }),
        });
        return response.json();
    }

    async getEventStats(eventId: string): Promise<{
        registrationTrend: { date: string; count: number }[];
        demographicBreakdown: Record<string, number>;
        skillLevelDistribution: Record<string, number>;
    }> {
        const response = await fetchWithAuth(`/api/events/${eventId}/stats`);
        return response.json();
    }
}

export const eventService = new EventService(); 