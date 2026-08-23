import { useState, useEffect } from 'react';
import API_BASE, { getAvatarUrl } from '../../lib/api';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, Users, Clock, Calendar, CreditCard, FileText, Settings, LogOut, Menu, X, Bell, Search, ChevronDown, MessageSquareWarning, ShieldCheck, UserCheck, Video
} from 'lucide-react';

export function DashboardLayout({ children, role }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('dayflow_token');
      if (!token) return;
      const res = await fetch(`${API_BASE}/api/data/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications');
    }
  };

  useEffect(() => {
    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      const token = localStorage.getItem('dayflow_token');
      await fetch(`${API_BASE}/api/data/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const superadminNav = [
    { name: 'Overview', path: '/superadmin/dashboard', icon: LayoutDashboard },
    { name: 'Profiles', path: '/superadmin/profiles', icon: Users },
    { name: 'HR Approvals', path: '/superadmin/hr-approval', icon: UserCheck },
    { name: 'Reports', path: '/superadmin/reports', icon: FileText },
    { name: 'Complaints', path: '/superadmin/complaints', icon: MessageSquareWarning },
    { name: 'Meetings', path: '/superadmin/meetings', icon: Video },
  ];

  const hrNav = [
    { name: 'Overview', path: '/hr/dashboard', icon: LayoutDashboard },
    { name: 'Employees', path: '/hr/employees', icon: Users },
    { name: 'Attendance', path: '/hr/attendance', icon: Clock },
    { name: 'Time Off', path: '/hr/timeoff', icon: Calendar },
    { name: 'Payroll', path: '/hr/payroll', icon: CreditCard },
    { name: 'Reports', path: '/hr/reports', icon: FileText },
    { name: 'Complaints', path: '/hr/complaints', icon: MessageSquareWarning },
    { name: 'Meetings', path: '/hr/meetings', icon: Video },
  ];

  const employeeNav = [
    { name: 'Overview', path: '/employee/dashboard', icon: LayoutDashboard },
    { name: 'Attendance', path: '/employee/attendance', icon: Clock },
    { name: 'Time Off', path: '/employee/timeoff', icon: Calendar },
    { name: 'Payroll', path: '/employee/payroll', icon: CreditCard },
    { name: 'Complaints', path: '/employee/complaints', icon: MessageSquareWarning },
    { name: 'Meetings', path: '/employee/meetings', icon: Video },
  ];

  let navItems = employeeNav;
  if (role === 'admin') navItems = superadminNav;
  if (role === 'hr') navItems = hrNav;

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const isActive = (path) => location.pathname === path;

  const getDashboardPath = () => {
    if (role === 'admin') return '/superadmin/dashboard';
    if (role === 'hr') return '/hr/dashboard';
    return '/employee/dashboard';
  };

  const getSettingsPath = () => {
    if (role === 'admin') return '/superadmin/settings';
    if (role === 'hr') return '/hr/settings';
    return '/employee/settings';
  };

  const getProfilePath = () => {
    if (role === 'admin') return '/superadmin/profile';
    if (role === 'hr') return '/hr/profile';
    return '/employee/profile';
  };

  const NavLink = ({ item, onClick }) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    return (
      <button
        onClick={() => { navigate(item.path); onClick?.(); }}
        className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
          active 
            ? 'bg-[#502D55]/10 text-[#502D55]' 
            : 'text-gray-600 hover:bg-gray-100 hover:text-[#171923]'
        }`}
      >
        <Icon size={20} className={`flex-shrink-0 ${active ? 'text-[#502D55]' : 'text-gray-400 group-hover:text-[#502D55]'}`} />
        {item.name}
      </button>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F3F4F6]">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm"></div>
        </div>
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between px-5 border-b border-gray-100">
          <Link to={getDashboardPath()} className="font-serif text-xl font-bold text-[#502D55]">DAYFLOW</Link>
          <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map(item => <NavLink key={item.name} item={item} onClick={() => setSidebarOpen(false)} />)}
        </nav>
        <div className="border-t border-gray-100 p-3 space-y-1">
          <button onClick={() => { navigate(getSettingsPath()); setSidebarOpen(false); }} className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"><Settings size={20} className="text-gray-400" /> Settings</button>
          <button onClick={handleLogout} className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600"><LogOut size={20} className="text-gray-400 group-hover:text-red-500" /> Sign Out</button>
        </div>
      </aside>

      <aside className="hidden lg:flex lg:flex-shrink-0 lg:flex-col w-[260px] border-r border-gray-200 bg-white">
        <div className="flex h-16 items-center px-6 border-b border-gray-100">
          <Link to={getDashboardPath()} className="font-serif text-xl font-bold text-[#502D55]">DAYFLOW</Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map(item => <NavLink key={item.name} item={item} />)}
        </nav>
        <div className="border-t border-gray-100 p-3 space-y-1">
          <button onClick={() => navigate(getSettingsPath())} className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"><Settings size={20} className="text-gray-400 group-hover:text-[#502D55]" /> Settings</button>
          <button onClick={handleLogout} className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600"><LogOut size={20} className="text-gray-400 group-hover:text-red-500" /> Sign Out</button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-700"><Menu size={22} /></button>
            <div className="hidden md:flex relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Global search across the application..." className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#502D55]/20 focus:border-[#502D55] w-full bg-gray-50/50" />
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-3">
            <div className="relative">
              <button onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }} className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                <Bell size={20} />
                {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-lg bg-white shadow-lg border border-gray-200 z-50">
                  <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                    <button onClick={async () => {
                      for (const n of notifications.filter(x => !x.is_read)) {
                        await handleMarkAsRead(n._id);
                      }
                    }} className="text-xs text-[#502D55] hover:text-[#935073] font-medium">Mark all read</button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500 text-sm">No new notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n._id} 
                          onClick={() => handleMarkAsRead(n._id)}
                          className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-[#502D55]/[0.02]' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            {!n.is_read && <span className="mt-1.5 h-2 w-2 rounded-full bg-[#502D55] flex-shrink-0 animate-pulse"></span>}
                            <div className={!n.is_read ? '' : 'ml-5'}>
                              <p className="text-sm font-medium text-gray-900">{n.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                              <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }} className="flex items-center gap-3 rounded-lg px-3 py-1.5 hover:bg-gray-100 transition-colors">
                <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0">
                  <img src={getAvatarUrl(user)} alt={user?.name || 'User'} className="h-8 w-8 rounded-full object-cover shadow-sm border border-gray-100 bg-gray-50" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-800 leading-tight">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role === 'admin' ? 'Super Admin' : user?.position}</p>
                </div>
                <ChevronDown size={16} className="hidden md:block text-gray-400" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white shadow-lg border border-gray-200 z-50 py-1">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
                  </div>
                  <button onClick={() => { navigate(getProfilePath()); setProfileOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Users size={16} /> My Profile</button>
                  <div className="h-px bg-gray-100 my-1"></div>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium flex items-center gap-2"><LogOut size={16} /> Sign Out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {(notifOpen || profileOpen) && (
        <div className="fixed inset-0 z-40" onClick={() => { setNotifOpen(false); setProfileOpen(false); }}></div>
      )}
    </div>
  );
}
