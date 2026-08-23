import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowRight, 
  Users, 
  Calendar, 
  Briefcase, 
  CheckCircle2, 
  ShieldCheck, 
  BarChart3,
  Clock
} from 'lucide-react';

export function Landing() {
  const { user, role } = useAuth();

  // If already logged in, seamlessly redirect to dashboard
  if (user) {
    return <Navigate to={(role === 'admin' || role === 'hr') ? '/admin/dashboard' : '/employee/dashboard'} replace />;
  }

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-[#502D55] selection:text-white">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#502D55] p-2 rounded-xl">
              <img src="/odoo_logo.png" alt="Odoo Logo" className="h-6 w-auto brightness-0 invert" />
            </div>
            <span className="font-serif text-2xl font-bold tracking-tight text-gray-900">Dayflow</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-sm font-semibold text-gray-600 hover:text-[#502D55] transition-colors">
              Sign In
            </Link>
            <Link 
              to="/login" 
              className="group flex items-center gap-2 bg-[#502D55] text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-md hover:bg-[#935073] hover:shadow-lg transition-all"
            >
              Get Started
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#f1e1f7] via-white to-white"></div>
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[800px] h-[600px] bg-[#935073] opacity-[0.08] blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[600px] h-[600px] bg-[#502D55] opacity-[0.06] blur-[100px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#502D55]/5 text-[#502D55] border border-[#502D55]/10 text-sm font-medium mb-8 animate-fade-in-up">
            <span className="flex h-2 w-2 rounded-full bg-[#502D55] animate-pulse"></span>
            Odoo Hackathon 2026 Innovation
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-8 font-serif">
            Your Workforce, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#502D55] to-[#935073]">
              Perfectly Aligned.
            </span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-xl text-gray-600 mb-10 leading-relaxed font-medium">
            Elevate your company's HR experience with Dayflow. From seamless payroll management to intuitive attendance tracking, we bring harmony to your workday.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/login" 
              className="w-full sm:w-auto px-8 py-4 bg-[#502D55] text-white rounded-full font-bold text-lg shadow-xl shadow-[#502D55]/20 hover:bg-[#935073] hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
            >
              Access Dashboard
              <ArrowRight size={20} />
            </Link>
          </div>
          
          {/* Dashboard Preview Image/Mockup */}
          <div className="mt-20 relative mx-auto max-w-5xl">
            <div className="rounded-2xl border border-gray-200/60 bg-white/50 backdrop-blur-xl p-2 shadow-2xl overflow-hidden ring-1 ring-black/5">
              <div className="rounded-xl border border-gray-100 bg-gray-50 h-[400px] lg:h-[600px] w-full relative overflow-hidden flex items-center justify-center">
                {/* Abstract UI representation */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="relative z-10 flex flex-col items-center gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl px-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transform -rotate-2 hover:rotate-0 transition-transform">
                      <div className="h-10 w-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mb-4"><Users /></div>
                      <div className="h-3 w-2/3 bg-gray-200 rounded-full mb-2"></div>
                      <div className="h-2 w-1/2 bg-gray-100 rounded-full"></div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transform scale-105 z-10 shadow-xl border-[#502D55]/20">
                      <div className="h-10 w-10 bg-[#502D55]/10 text-[#502D55] rounded-xl flex items-center justify-center mb-4"><BarChart3 /></div>
                      <div className="h-3 w-3/4 bg-gray-200 rounded-full mb-2"></div>
                      <div className="h-2 w-2/3 bg-gray-100 rounded-full mb-4"></div>
                      <div className="h-16 w-full bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg"></div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transform rotate-2 hover:rotate-0 transition-transform">
                      <div className="h-10 w-10 bg-green-50 text-green-500 rounded-xl flex items-center justify-center mb-4"><Calendar /></div>
                      <div className="h-3 w-1/2 bg-gray-200 rounded-full mb-2"></div>
                      <div className="h-2 w-1/3 bg-gray-100 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-serif text-gray-900 mb-4">Everything you need to manage your team</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">A complete suite of tools designed to automate HR processes and empower your employees.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#502D55]/30 transition-all group">
              <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Users size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Employee Directory</h3>
              <p className="text-gray-600 leading-relaxed">Centralized database for all employee records, contact information, and professional profiles.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#502D55]/30 transition-all group">
              <div className="h-14 w-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Clock size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Time & Attendance</h3>
              <p className="text-gray-600 leading-relaxed">Effortless clock-in/out tracking, automated timesheets, and real-time attendance monitoring.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#502D55]/30 transition-all group">
              <div className="h-14 w-14 bg-[#502D55]/10 text-[#502D55] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#502D55] group-hover:text-white transition-colors">
                <Briefcase size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Payroll Integration</h3>
              <p className="text-gray-600 leading-relaxed">Automated salary calculations factoring in attendance, leaves, base pay, and allowances.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Section */}
      <div className="border-t border-gray-100 py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-green-500" size={24} />
            <span className="font-semibold text-gray-700">Enterprise Grade Security</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-[#502D55]" size={24} />
            <span className="font-semibold text-gray-700">99.9% Uptime Guarantee</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="text-blue-500" size={24} />
            <span className="font-semibold text-gray-700">Built for Odoo Hackathon</span>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <div className="bg-white/10 p-1.5 rounded-lg">
              <img src="/odoo_logo.png" alt="Odoo" className="h-5 brightness-0 invert" />
            </div>
            <span className="font-serif font-bold text-white text-lg">Dayflow</span>
          </div>
          <p className="text-sm">&copy; {new Date().getFullYear()} Odoo India Hackathon. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
