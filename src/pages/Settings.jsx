import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Lock, Bell, Settings as SettingsIcon, Shield } from 'lucide-react';

export function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [showToast, setShowToast] = useState(null);

  const toast = (msg) => { setShowToast(msg); setTimeout(() => setShowToast(null), 3000); };

  const tabs = [
    { id: 'account', name: 'Account', icon: User },
    { id: 'security', name: 'Security', icon: Lock },
    { id: 'notifications', name: 'Notifications', icon: Bell },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {showToast && (
        <div className="fixed top-20 right-6 z-50"><div className="rounded-lg bg-[#171923] text-white px-5 py-3 text-sm shadow-lg">{showToast}</div></div>
      )}

      <div>
        <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#171923]">Settings</h1>
        <p className="mt-1 text-sm text-[#6B7280]">Manage your account preferences and security.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Side nav */}
        <nav className="sm:w-48 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-2 space-y-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === tab.id ? 'bg-[#502D55]/10 text-[#502D55]' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} /> {tab.name}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6">
          {activeTab === 'account' && (
            <div className="space-y-6">
              <h3 className="text-base font-semibold text-[#171923] font-serif">Account Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#171923] mb-1.5">Full Name</label>
                  <input type="text" defaultValue={user?.name} className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#502D55] focus:outline-none focus:ring-2 focus:ring-[#502D55]/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#171923] mb-1.5">Email</label>
                  <input type="email" defaultValue={user?.email} disabled className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#171923] mb-1.5">Phone</label>
                  <input type="text" defaultValue="+91 99887 76655" className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#502D55] focus:outline-none focus:ring-2 focus:ring-[#502D55]/20" />
                </div>
              </div>
              <button onClick={() => toast('Profile updated successfully.')} className="rounded-lg bg-[#502D55] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#5a3256] transition-colors">Save Changes</button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-base font-semibold text-[#171923] font-serif">Security Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#171923] mb-1.5">Current Password</label>
                  <input type="password" placeholder="Enter current password" className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#502D55] focus:outline-none focus:ring-2 focus:ring-[#502D55]/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#171923] mb-1.5">New Password</label>
                  <input type="password" placeholder="Enter new password" className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#502D55] focus:outline-none focus:ring-2 focus:ring-[#502D55]/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#171923] mb-1.5">Confirm New Password</label>
                  <input type="password" placeholder="Confirm new password" className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#502D55] focus:outline-none focus:ring-2 focus:ring-[#502D55]/20" />
                </div>
              </div>
              <button onClick={() => toast('Password change is not available in demo.')} className="rounded-lg bg-[#502D55] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#5a3256] transition-colors">Update Password</button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-base font-semibold text-[#171923] font-serif">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { label: 'Email notifications for leave approvals', defaultChecked: true },
                  { label: 'Email notifications for payroll updates', defaultChecked: true },
                  { label: 'In-app attendance reminders', defaultChecked: true },
                  { label: 'Weekly summary email', defaultChecked: false },
                  { label: 'Marketing & product updates', defaultChecked: false },
                ].map((item, i) => (
                  <label key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer">
                    <span className="text-sm text-[#171923]">{item.label}</span>
                    <input type="checkbox" defaultChecked={item.defaultChecked} className="h-4 w-4 rounded border-gray-300 text-[#502D55] focus:ring-[#502D55]" />
                  </label>
                ))}
              </div>
              <button onClick={() => toast('Preferences saved.')} className="rounded-lg bg-[#502D55] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#5a3256] transition-colors">Save Preferences</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
