import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  Mail,
  User,
  Building,
  ArrowRight,
  UserCheck,
  GraduationCap
} from 'lucide-react';

export const LoginPage = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Mode: 'login' or 'register'
  const [mode, setMode] = useState('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Applicant',
    department: 'School of Computing & Data Science'
  });
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  const roles = [
    {
      id: 'Applicant',
      label: 'Applicant',
      desc: 'Submit documents, track status & request evaluations'
    },
    {
      id: 'Reviewer',
      label: 'Reviewer',
      desc: 'Verify records, run AI extractions & make case decisions'
    },
    {
      id: 'Supervisor',
      label: 'Supervisor',
      desc: 'Monitor ageing queues, workload balancing & escalations'
    },
    {
      id: 'Compliance Admin',
      label: 'Compliance Admin',
      desc: 'Manage institutional policies, user accounts & audit logs'
    }
  ];

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const user = await login(loginEmail, loginPassword);
      // Role-aware redirect
      if (user.role === 'Applicant') {
        navigate('/');
      } else if (user.role === 'Supervisor') {
        navigate('/supervisor');
      } else if (user.role === 'Compliance Admin') {
        navigate('/audit-settings');
      } else {
        navigate('/cases');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (registerData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const user = await register({
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
        role: registerData.role,
        department: registerData.department
      });

      setSuccessMsg('Account registered successfully! Redirecting...');
      setTimeout(() => {
        if (user.role === 'Applicant') {
          navigate('/');
        } else if (user.role === 'Supervisor') {
          navigate('/supervisor');
        } else if (user.role === 'Compliance Admin') {
          navigate('/audit-settings');
        } else {
          navigate('/cases');
        }
      }, 500);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-navy-900 to-slate-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Logo */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-brand-500/30 mb-3">
          U
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          IntelliDoc Hub
        </h1>
        <p className="mt-1 text-xs text-slate-400 font-medium">
          Higher Education Intelligent Document Intake & Decision Hub
        </p>
        <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-brand-950/80 border border-brand-800/80 text-brand-300 text-[11px] font-semibold">
          <Sparkles className="w-3 h-3" /> Powered by Gemini 3.6 Flash
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6 border border-slate-200">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
                }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'register'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
                }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium animate-in fade-in">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium animate-in fade-in">
              {successMsg}
            </div>
          )}

          {/* SIGN IN FORM */}
          {mode === 'login' ? (
            <form className="space-y-4" onSubmit={handleLoginSubmit}>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  University Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="user@university.edu"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="block w-full pl-9 pr-10 py-2.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center text-slate-600 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
                  />
                  <span className="ml-2">Remember this device</span>
                </label>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-brand-600 hover:text-brand-700 font-semibold"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 rounded-lg shadow-sm text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In to Hub <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500">
                  New student, faculty, or staff member?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setError(''); }}
                    className="font-bold text-brand-600 hover:text-brand-700"
                  >
                    Register your account &rarr;
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* REGISTRATION FORM */
            <form className="space-y-4" onSubmit={handleRegisterSubmit}>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="e.g. Dr. Naveen Sharma"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  University Email *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="netid@university.edu"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  University Role *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {roles.map(r => (
                    <label
                      key={r.id}
                      className={`p-2.5 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${registerData.role === r.id
                          ? 'border-brand-600 bg-brand-50/60 ring-1 ring-brand-500'
                          : 'border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-800">{r.label}</span>
                        <input
                          type="radio"
                          name="role"
                          value={r.id}
                          checked={registerData.role === r.id}
                          onChange={(e) => setRegisterData({ ...registerData, role: e.target.value })}
                          className="text-brand-600 focus:ring-brand-500 h-3.5 w-3.5"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">{r.desc}</p>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Department / Academic Unit
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={registerData.department}
                    onChange={(e) => setRegisterData({ ...registerData, department: e.target.value })}
                    className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="e.g. School of Computing, Admissions Office..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showRegisterPassword ? 'text' : 'password'}
                      required
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="Min 6 characters"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showRegisterPassword ? 'text' : 'password'}
                      required
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="Repeat password"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center text-xs text-slate-600">
                <input
                  type="checkbox"
                  id="showPasswordReg"
                  checked={showRegisterPassword}
                  onChange={(e) => setShowRegisterPassword(e.target.checked)}
                  className="mr-2 h-3.5 w-3.5 rounded text-brand-600"
                />
                <label htmlFor="showPasswordReg" className="cursor-pointer">Show password characters</label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 rounded-lg shadow-sm text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Registering Account...
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" /> Create University Account
                  </>
                )}
              </button>

              <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(''); }}
                    className="font-bold text-brand-600 hover:text-brand-700"
                  >
                    Sign in to your account &rarr;
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Security notice */}
        <p className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          TLS 1.3 Encrypted &bull; Institutional Authentication & RBAC Policy
        </p>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-2">Password Reset Assistance</h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              If you have registered an account and forgotten your credentials, please contact your university Compliance Administrator at <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-brand-700">admin@university.edu</code> to reset your security credentials.
            </p>
            <button
              onClick={() => setForgotModalOpen(false)}
              className="w-full py-2 bg-brand-600 text-white rounded-lg text-xs font-bold hover:bg-brand-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
