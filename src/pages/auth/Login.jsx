import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Eye, EyeOff, UserCircle2 } from 'lucide-react';

export function Login() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userData = await login(loginId, password);
      if (userData.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/employee/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const demoProfiles = [
    { name: 'Admin User', id: 'admin@dayflow.demo', pass: 'admin123', role: 'Admin' },
    { name: 'Sarah Connor', id: 'OISACO20260002', pass: 'password123', role: 'Employee' },
    { name: 'David Miller', id: 'OIDAMI20260003', pass: 'password123', role: 'Employee' }
  ];

  const handleQuickLogin = (profile) => {
    setLoginId(profile.id);
    setPassword(profile.pass);
  };

  return (
    <div className="flex min-h-screen bg-[#F3F4F6] font-sans">
      {/* Left Side - Branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-[#502D55] p-16 text-white lg:flex relative overflow-hidden">
        <div className="relative z-10">
          
          {/* Logo Container - Pure white bg to ensure any logo looks perfect and professional */}
          <div className="mb-16 bg-white w-fit px-8 py-4 rounded-2xl shadow-lg border border-white/20">
            <img src="/odoo_logo.png" alt="Odoo Logo" className="h-10 w-auto object-contain" />
          </div>

          <h1 className="mb-6 font-serif text-5xl font-bold leading-tight text-white">
            Welcome Back to<br />Dayflow.
          </h1>
          <p className="text-xl font-medium text-white/80 max-w-md leading-relaxed">
            Your workday, perfectly aligned. Log in to access your dashboard.
          </p>
        </div>
        
        {/* Decorative elements using Violet Dusk palette */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#935073] opacity-20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-black opacity-20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 text-white/60 text-sm">
          <p>&copy; {new Date().getFullYear()} Odoo India Pvt. Ltd. All rights reserved.</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-20 bg-white shadow-2xl z-10">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10">
            <h2 className="font-serif text-4xl font-bold text-[#502D55] tracking-tight">Sign In</h2>
            <p className="mt-3 text-gray-500 text-lg">Enter your details to continue.</p>
          </div>

          {error && (
            <div className="mb-8 rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100 flex items-start gap-3">
              <svg className="h-5 w-5 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Login Id or Email</label>
              <input
                type="text"
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 focus:border-[#502D55] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#502D55] transition-colors shadow-sm"
                placeholder="OIJODO20260001 or email@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-3.5 pr-10 text-sm text-gray-900 focus:border-[#502D55] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#502D55] transition-colors shadow-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#502D55] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-lg bg-[#502D55] py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#935073] focus:outline-none focus:ring-2 focus:ring-[#502D55] focus:ring-offset-2 disabled:opacity-70 transition-all hover:shadow-lg items-center"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
              </button>
            </div>
          </form>

          <p className="mt-10 text-center text-sm font-medium text-gray-500">
            Don't have an Account?{' '}
            <Link to="/signup" className="text-[#935073] hover:text-[#502D55] font-semibold underline underline-offset-4 transition-colors">
              Sign Up
            </Link>
          </p>

          <div className="mt-8 pt-8 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 mb-4 text-center uppercase tracking-wider">Saved Demo Profiles</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {demoProfiles.map((profile, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleQuickLogin(profile)}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-[#502D55] hover:border-[#502D55] text-gray-700 hover:text-white transition-all group shadow-sm"
                >
                  <UserCircle2 size={24} className="mb-1 text-gray-400 group-hover:text-white/80 transition-colors" />
                  <span className="text-xs font-bold whitespace-nowrap">{profile.name}</span>
                  <span className="text-[10px] font-medium opacity-70">{profile.role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
