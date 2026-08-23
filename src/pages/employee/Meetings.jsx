import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Video, CheckCircle, XCircle, Users, Link as LinkIcon, Loader2 } from 'lucide-react';
import API_BASE from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

export function EmployeeMeetings() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMeetings = async () => {
    try {
      const token = localStorage.getItem('dayflow_token');
      const response = await fetch(`${API_BASE}/api/data/meetings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const userId = user?.id || user?._id;
        const mappedData = data.map(m => {
          let status = 'pending';
          if (m.accepted_by && m.accepted_by.some(u => (u._id || u).toString() === userId.toString())) {
            status = 'accepted';
          } else if (m.rejected_by && m.rejected_by.some(u => (u._id || u).toString() === userId.toString())) {
            status = 'rejected';
          }
          return { ...m, status };
        });
        setMeetings(mappedData);
      }
    } catch (error) {
      console.error('Failed to load meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [user]);

  const handleAction = async (id, action) => {
    try {
      const token = localStorage.getItem('dayflow_token');
      const response = await fetch(`${API_BASE}/api/data/meetings/${id}/rsvp`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: action })
      });
      
      if (response.ok) {
        setMeetings(meetings.map(m => m._id === id ? { ...m, status: action } : m));
      }
    } catch (err) {
      console.error('RSVP Failed:', err);
    }
  };

  const isMeetingNow = (dateStr) => {
    const meetingTime = new Date(dateStr).getTime();
    const now = new Date().getTime();
    // Assuming meeting is "now" if it's within 15 minutes before or 60 minutes after start
    return now >= meetingTime - 15 * 60000 && now <= meetingTime + 60 * 60000;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="animate-spin text-[#502D55]" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#171923]">Meetings</h1>
        <p className="mt-1 text-xs text-[#6B7280]">View, accept, and join meetings scheduled by admins or HR.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {meetings.map((meeting) => {
          const isPast = new Date(meeting.date) < new Date() && !isMeetingNow(meeting.date);
          const isNow = isMeetingNow(meeting.date);
          
          return (
            <div key={meeting._id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow">
              
              {/* Status Badge indicator */}
              <div className={`absolute top-0 left-0 w-1 h-full ${
                meeting.status === 'accepted' ? 'bg-green-500' :
                meeting.status === 'rejected' ? 'bg-red-500' :
                'bg-yellow-400'
              }`} />

              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-[#171923] line-clamp-1">{meeting.title}</h3>
                  <div className="text-xs text-[#502D55] font-semibold mt-1 bg-[#502D55]/10 px-2 py-0.5 rounded-full inline-block">
                    Organized by {meeting.host_id?.name || 'Admin'}
                  </div>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg text-[#502D55]">
                  <Video size={18} />
                </div>
              </div>

              <div className="space-y-2 mb-5">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <CalendarIcon size={14} className="text-gray-400" />
                  <span className="font-medium">{new Date(meeting.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Clock size={14} className="text-gray-400" />
                  <span className="font-medium">
                    {meeting.time || new Date(meeting.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Users size={14} className="text-gray-400" />
                  <span className="font-medium truncate">{meeting.participants?.map(p => p.name).join(', ') || 'Team'}</span>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                {/* RSVP Actions */}
                {meeting.status === 'pending' && !isPast ? (
                  <div className="flex items-center gap-2 w-full">
                    <button 
                      onClick={() => handleAction(meeting._id, 'accepted')}
                      className="flex-1 inline-flex justify-center items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 text-xs font-bold transition-colors"
                    >
                      <CheckCircle size={14} /> Accept
                    </button>
                    <button 
                      onClick={() => handleAction(meeting._id, 'rejected')}
                      className="flex-1 inline-flex justify-center items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold transition-colors"
                    >
                      <XCircle size={14} /> Decline
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                      meeting.status === 'accepted' ? 'bg-green-50 text-green-700' :
                      meeting.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                    </span>

                    {/* Join Button */}
                    {meeting.status === 'accepted' && (
                      <a 
                        href={meeting.link} 
                        target="_blank" 
                        rel="noreferrer"
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-xs ${
                          isNow 
                          ? 'bg-[#502D55] text-white hover:bg-[#3e2342] animate-pulse' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <LinkIcon size={12} /> {isNow ? 'Join Now' : 'Link'}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
