import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { Navigation } from '../components/Navigation';

interface Event {
  id: string;
  name: string;
  event_date: string;
  location: string;
  attendees: Attendee[];
}

interface Attendee {
  id: string;
  member_number: string;
  first_name: string;
  last_name: string;
  check_in_time: string;
}

export function EventCheckInPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [memberNumber, setMemberNumber] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [recentCheckIns, setRecentCheckIns] = useState<Attendee[]>([]);

  useEffect(() => {
    if (id) {
      fetchEvent();
    }
  }, [id]);

  useEffect(() => {
    // Focus on input field
    inputRef.current?.focus();
  }, []);

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/events/${id}`);
      setEvent(response.data);
      setRecentCheckIns(response.data.attendees.slice(0, 5));
    } catch (error) {
      toast.error('Failed to fetch event');
      navigate('/events');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!memberNumber.trim()) {
      toast.error('Please enter a member number');
      return;
    }

    try {
      const response = await api.post(`/events/${id}/checkin`, {
        memberNumber: memberNumber.trim()
      });

      toast.success(`Checked in: ${response.data.member.name}`);
      
      // Add to recent check-ins
      setRecentCheckIns(prev => [{
        id: Date.now().toString(),
        member_number: response.data.member.member_number,
        first_name: response.data.member.name.split(' ')[0],
        last_name: response.data.member.name.split(' ').slice(1).join(' '),
        check_in_time: new Date().toISOString()
      }, ...prev].slice(0, 5));

      // Update attendee count
      if (event) {
        fetchEvent();
      }

      // Clear input
      setMemberNumber('');
      inputRef.current?.focus();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Check-in failed');
      inputRef.current?.select();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation title="Event Check-in" />
        <div className="flex items-center justify-center h-96">
          <div className="text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation title="Event Check-in" />
      
      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Event Info */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold mb-2">{event.name}</h1>
                <p className="text-gray-600">
                  📅 {new Date(event.event_date).toLocaleDateString('en-GB')} 
                  <span className="mx-2">•</span>
                  📍 {event.location}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">
                  {event.attendees.length}
                </div>
                <div className="text-sm text-gray-500">Attendees</div>
              </div>
            </div>
          </div>

          {/* Check-in Form */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Check-in Member</h2>
            <form onSubmit={handleCheckIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scan or Enter Member Number
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={memberNumber}
                  onChange={(e) => setMemberNumber(e.target.value)}
                  placeholder="Member number or scan barcode"
                  className="input text-lg"
                  autoComplete="off"
                />
              </div>
              <button type="submit" className="btn btn-primary w-full">
                Check In
              </button>
            </form>
          </div>

          {/* Recent Check-ins */}
          {recentCheckIns.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Recent Check-ins</h2>
              <div className="space-y-2">
                {recentCheckIns.map((attendee) => (
                  <div
                    key={attendee.id}
                    className="flex justify-between items-center py-2 border-b last:border-0"
                  >
                    <div>
                      <div className="font-medium">
                        {attendee.first_name} {attendee.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {attendee.member_number}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(attendee.check_in_time).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => navigate(`/events/${id}/attendees`)}
                className="btn btn-secondary w-full mt-4"
              >
                View All Attendees ({event.attendees.length})
              </button>
            </div>
          )}

          {/* Back Button */}
          <div className="mt-6">
            <button
              onClick={() => navigate('/events')}
              className="btn btn-secondary"
            >
              Back to Events
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
