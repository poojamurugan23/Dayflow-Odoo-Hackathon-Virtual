import { useState, useEffect } from 'react';
import API_BASE from '../../lib/api';
import { Video, Plus, CheckCircle, Calendar, Clock, Link as LinkIcon, Users, X } from 'lucide-react';

export function SuperAdminMeetings() {
  const [meetings, setMeetings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [link, setLink] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('dayflow_token');
      
      const [meetingsRes, employeesRes] = await Promise.all([
        fetch(`${API_BASE}/api/data/meetings`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/data/employees`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (meetingsRes.ok && employeesRes.ok) {
        const mData = await meetingsRes.json();
        const eData = await employeesRes.json();
        setMeetings(mData);
        setEmployees(eData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleParticipant = (id) => {
    if (selectedParticipants.includes(id)) {
      setSelectedParticipants(selectedParticipants.filter(pId => pId !== id));
    } else {
      setSelectedParticipants([...selectedParticipants, id]);
    }
  };

  const handleGenerateLink = () => {
    // Generate a random meet-like link for demo purposes
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let str = '';
    for(let i=0; i<3; i++) str += chars.charAt(Math.floor(Math.random() * chars.length));
    str += '-';
    for(let i=0; i<4; i++) str += chars.charAt(Math.floor(Math.random() * chars.length));
    str += '-';
    for(let i=0; i<3; i++) str += chars.charAt(Math.floor(Math.random() * chars.length));
    setLink(`https://meet.dayflow.demo/${str}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !date || !time) return setError('Title, date, and time are required.');
    
    setSubmitLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('dayflow_token');
      const response = await fetch(`${API_BASE}/api/data/meetings`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          title, description, date, time, link, participants: selectedParticipants
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to schedule meeting');
      }
      
      setSuccess('Meeting scheduled successfully. Invites have been sent.');
      setIsNewModalOpen(false);
      
      // Reset form
      setTitle('');
      setDescription('');
      setDate('');
      setTime('');
      setLink('');
      setSelectedParticipants([]);
      
      fetchData();
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#502D55] border-t-transparent"></div>
    </div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-gray-900">Meetings</h1>
          <p className="mt-1 text-sm text-gray-500">Schedule video meetings with employees and HRs.</p>
        </div>
        <button 
          onClick={() => setIsNewModalOpen(true)}
          className="inline-flex items-center gap-2 bg-[#502D55] text-white px-5 py-2.5 rounded-xl font-medium shadow-md shadow-[#502D55]/20 hover:bg-[#935073] transition-colors"
        >
          <Plus size={20} />
          Schedule Meeting
        </button>
      </div>

      {success && (
        <div className="rounded-xl bg-green-50 p-4 border border-green-100 flex items-start gap-3 animate-in fade-in">
          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
          <p className="text-sm text-green-700 font-medium">{success}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {meetings.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-gray-100">
            <Video className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No Meetings Scheduled</h3>
            <p className="mt-1 text-sm text-gray-500">Click the button above to schedule your first meeting.</p>
          </div>
        ) : (
          meetings.map(meeting => (
            <div key={meeting._id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col h-full">
              <h3 className="font-semibold text-gray-900 text-lg mb-2">{meeting.title}</h3>
              {meeting.description && (
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{meeting.description}</p>
              )}
              
              <div className="mt-auto space-y-3 pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={16} className="text-[#502D55]" />
                  <span>{new Date(meeting.date).toDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock size={16} className="text-[#502D55]" />
                  <span>{meeting.time}</span>
                </div>
                {meeting.link && (
                  <div className="flex items-center gap-2 text-sm text-[#502D55]">
                    <LinkIcon size={16} />
                    <a href={meeting.link} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline hover:text-[#935073] truncate">
                      {meeting.link}
                    </a>
                  </div>
                )}
                
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users size={16} className="text-gray-400" />
                    <span>{meeting.participants?.length || 0} Participants</span>
                  </div>
                  {meeting.accepted_by && meeting.accepted_by.length > 0 && (
                    <div className="flex flex-col mt-1 bg-green-50/50 p-2.5 rounded-lg border border-green-100">
                      <span className="text-xs font-semibold text-green-800 mb-1.5">Accepted By:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {meeting.accepted_by.map(user => {
                          if (!user) return null;
                          return (
                            <div key={user._id || user.id} className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-full border border-green-200 shadow-sm" title={user.name}>
                              <img 
                                src={user.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`} 
                                alt={user.name || 'User'} 
                                className="w-5 h-5 rounded-full object-cover"
                              />
                              <span className="text-[10px] font-bold text-gray-700">{user.name ? user.name.split(' ')[0] : 'Unknown'}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {meeting.rejected_by && meeting.rejected_by.length > 0 && (
                    <div className="flex flex-col mt-1 bg-red-50/50 p-2.5 rounded-lg border border-red-100">
                      <span className="text-xs font-semibold text-red-800 mb-1.5">Declined By:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {meeting.rejected_by.map(user => {
                          if (!user) return null;
                          return (
                            <div key={user._id || user.id} className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-full border border-red-200 shadow-sm" title={user.name}>
                              <img 
                                src={user.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`} 
                                alt={user.name || 'User'} 
                                className="w-5 h-5 rounded-full object-cover"
                              />
                              <span className="text-[10px] font-bold text-gray-700">{user.name ? user.name.split(' ')[0] : 'Unknown'}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Meeting Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900 font-serif">Schedule New Meeting</h2>
              <button 
                onClick={() => setIsNewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col lg:flex-row gap-8">
              <div className="flex-1 space-y-5">
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                    {error}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title *</label>
                  <input 
                    type="text" 
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#502D55] focus:border-transparent outline-none"
                    placeholder="E.g., Weekly Sync, HR Review"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input 
                      type="date" 
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#502D55] focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                    <input 
                      type="time" 
                      required
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#502D55] focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Video Link</label>
                  <div className="flex gap-2">
                    <input 
                      type="url" 
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#502D55] focus:border-transparent outline-none text-sm"
                      placeholder="https://zoom.us/j/..."
                    />
                    <button
                      type="button"
                      onClick={handleGenerateLink}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors whitespace-nowrap"
                    >
                      Generate Auto Link
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#502D55] focus:border-transparent outline-none h-24 text-sm"
                    placeholder="Agenda or notes..."
                  />
                </div>
              </div>

              {/* Participants Selector */}
              <div className="lg:w-72 flex flex-col border-l border-gray-100 lg:pl-8">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Select Participants</h3>
                  <span className="text-xs bg-[#502D55]/10 text-[#502D55] px-2 py-0.5 rounded-full font-medium">
                    {selectedParticipants.length} Selected
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-2 max-h-80 border border-gray-100 rounded-xl p-2 bg-gray-50/50">
                  {employees.filter(emp => emp.role !== 'admin' && emp.is_approved !== false).map(emp => (
                    <label 
                      key={emp._id} 
                      className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors border ${
                        selectedParticipants.includes(emp._id) 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-white border-transparent hover:border-gray-200 shadow-sm'
                      }`}
                    >
                      <input 
                        type="checkbox"
                        checked={selectedParticipants.includes(emp._id)}
                        onChange={() => toggleParticipant(emp._id)}
                        className="mt-1 h-4 w-4 text-[#502D55] focus:ring-[#502D55] rounded border-gray-300"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                        <p className="text-[10px] text-gray-500 capitalize">{emp.role} • {emp.department || 'N/A'}</p>
                      </div>
                    </label>
                  ))}
                  {employees.filter(emp => emp.role !== 'admin' && emp.is_approved !== false).length === 0 && (
                    <div className="text-xs text-gray-500 text-center py-4">No available users.</div>
                  )}
                </div>

                <div className="mt-6">
                  <button 
                    type="submit"
                    disabled={submitLoading}
                    className="w-full bg-[#502D55] text-white py-3 rounded-xl font-bold shadow-md shadow-[#502D55]/20 hover:bg-[#935073] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {submitLoading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      <CheckCircle size={18} />
                    )}
                    Send Invites
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
