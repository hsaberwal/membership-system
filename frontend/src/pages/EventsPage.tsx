import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { Navigation } from '../components/Navigation';
import { AdminOnly } from '../components/RoleBasedAccess';

interface Event {
  id: string;
  name: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  created_at: string;
  attendee_count?: number;
}

interface EventForm {
  name: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
}

export function EventsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EventForm>();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events');
      setEvents(response.data);
    } catch (error) {
      toast.error('Failed to fetch events');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: EventForm) => {
    try {
      await api.post('/events', data);
      toast.success('Event created successfully');
      reset();
      setShowCreateForm(false);
      fetchEvents();
    } catch (error) {
      toast.error('Failed to create event');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    return time.substring(0, 5);
  };

  const isEventToday = (eventDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    return eventDate === today;
  };

  const isEventPast = (eventDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    return eventDate < today;
  };

  return (
    <AdminOnly>
      <div className="min-h-screen bg-gray-50">
        <Navigation title="Event Management" />
        
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Events</h2>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="btn btn-primary"
              >
                {showCreateForm ? 'Cancel' : 'Create New Event'}
              </button>
            </div>

            {/* Create Event Form */}
            {showCreateForm && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Create New Event</h3>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Event Name</label>
                      <input
                        {...register('name', { required: 'Event name is required' })}
                        className="input mt-1"
                      />
                      {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <input
                        {...register('location', { required: 'Location is required' })}
                        className="input mt-1"
                      />
                      {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      {...register('description')}
                      rows={3}
                      className="input mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Event Date</label>
                      <input
                        {...register('event_date', { required: 'Date is required' })}
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        className="input mt-1"
                      />
                      {errors.event_date && <p className="text-red-500 text-sm mt-1">{errors.event_date.message}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Start Time</label>
                      <input
                        {...register('start_time')}
                        type="time"
                        className="input mt-1"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">End Time</label>
                      <input
                        {...register('end_time')}
                        type="time"
                        className="input mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        reset();
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Create Event
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Events List */}
            <div className="bg-white rounded-lg shadow">
              {isLoading ? (
                <div className="p-12 text-center">Loading events...</div>
              ) : events.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <p>No events created yet</p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="btn btn-primary mt-4"
                  >
                    Create First Event
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-semibold">{event.name}</h3>
                            {isEventToday(event.event_date) && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                Today
                              </span>
                            )}
                            {isEventPast(event.event_date) && (
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                Past
                              </span>
                            )}
                          </div>
                          
                          {event.description && (
                            <p className="text-gray-600 mt-1">{event.description}</p>
                          )}
                          
                          <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                            <span>📅 {formatDate(event.event_date)}</span>
                            {event.start_time && (
                              <span>🕐 {formatTime(event.start_time)} - {formatTime(event.end_time)}</span>
                            )}
                            <span>📍 {event.location}</span>
                            <span>👥 {event.attendee_count || 0} attendees</span>
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          <button
                            onClick={() => navigate(`/events/${event.id}/checkin`)}
                            className="btn btn-primary btn-sm"
                            disabled={isEventPast(event.event_date)}
                          >
                            Check-in Members
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </AdminOnly>
  );
}
