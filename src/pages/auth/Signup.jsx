import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Loader2, Upload } from 'lucide-react';

export function Signup() {
  const [companyName, setCompanyName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      await signup(email, password, 'hr', name, companyName, phone);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen bg-[#F3F4F6] items-center justify-center">
        <div className="bg-white p-10 rounded-2xl shadow-xl border border-gray-100 max-w-md w-full text-center">
          <div className="mb-6 flex justify-center">
            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h2 className="font-serif text-3xl font-bold text-[#502D55] mb-4">Approval Pending!</h2>
          <p className="text-[#6B7280] mb-8 text-lg">Your HR account is pending Super Admin approval. You will be able to log in once approved.</p>
          <p className="text-sm text-[#6B7280]">Redirecting to login...</p>
        </div>
      </div>
    );
  }

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
            Transform Your<br />HR Experience.
          </h1>
          <p className="text-xl font-medium text-white/80 max-w-md leading-relaxed">
            Every workday, perfectly aligned. Join the most powerful platform for managing your organization.
          </p>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#935073] opacity-20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-black opacity-20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 text-white/60 text-sm">
          <p>&copy; {new Date().getFullYear()} Odoo India Pvt. Ltd. All rights reserved.</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-20 overflow-y-auto bg-white shadow-2xl z-10">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-10">
            <h2 className="font-serif text-4xl font-bold text-[#502D55] tracking-tight">Sign Up</h2>
            <p className="mt-3 text-gray-500 text-lg">Register your organization as an Admin.</p>
          </div>

          {error && (
            <div className="mb-8 rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100 flex items-start gap-3">
              <svg className="h-5 w-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-[#502D55] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#502D55] transition-colors shadow-sm"
                    placeholder="Odoo India"
                  />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white hover:bg-gray-50 text-gray-500 hover:text-[#502D55] px-4 rounded-lg flex items-center justify-center transition-colors border border-gray-200 shadow-sm"
                    title="Upload Company Logo"
                  >
                    <Upload size={18} />
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
                </div>
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-[#502D55] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#502D55] transition-colors shadow-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-[#502D55] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#502D55] transition-colors shadow-sm"
                placeholder="name@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-[#502D55] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#502D55] transition-colors shadow-sm"
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-3 pr-10 text-sm text-gray-900 focus:border-[#502D55] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#502D55] transition-colors shadow-sm"
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
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-3 pr-10 text-sm text-gray-900 focus:border-[#502D55] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#502D55] transition-colors shadow-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#502D55] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-lg bg-[#502D55] py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#935073] focus:outline-none focus:ring-2 focus:ring-[#502D55] focus:ring-offset-2 disabled:opacity-70 transition-all hover:shadow-lg items-center"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sign Up'}
              </button>
            </div>
          </form>

          <p className="mt-10 text-center text-sm font-medium text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-[#935073] hover:text-[#502D55] font-semibold underline underline-offset-4 transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
