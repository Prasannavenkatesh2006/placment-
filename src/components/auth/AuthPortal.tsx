import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Mail, Lock, ShieldCheck, ArrowRight, Sparkles, AlertCircle, KeyRound } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Role } from '../../types';
import { api } from '../../lib/api';

interface AuthPortalProps {
  onLogin: (userData: { email: string; role: Role; name: string; dept: string }) => void;
}

export function AuthPortal({ onLogin }: AuthPortalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'password' | 'setup' | 'otp'>('email');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const studentRegex = /^(cse|ece|eee|it|ice|mech|civil|bme|mechtr|cce|aids|arch|mba|mca)\d{6}@smvec\.ac\.in$/;
  const staffRegex = /^[a-z]+\.((cse|ece|eee|it|ice|mech|civil|bme|mechtr|cce|aids|arch|mba|mca))@smvec\.ac\.in$/;

  const identifyRole = (userEmail: string): { role: Role; dept: string } | null => {
    const studentMatch = userEmail.match(/^(cse|ece|eee|it|ice|mech|civil|bme|mechtr|cce|aids|arch|mba|mca)/);
    if (studentRegex.test(userEmail) && studentMatch) {
      return { role: 'student', dept: studentMatch[0].toUpperCase() };
    }
    const staffMatch = userEmail.match(/\.((cse|ece|eee|it|ice|mech|civil|bme|mechtr|cce|aids|arch|mba|mca))/);
    if (staffRegex.test(userEmail) && staffMatch) {
      return { role: 'staff', dept: staffMatch[1].toUpperCase() };
    }
    if (userEmail === 'admin@smvec.ac.in') return { role: 'staff', dept: 'ADMIN' };
    return null;
  };

  const handleError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(''), 3000);
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    try {
      const userData = await api.auth.googleLogin(credentialResponse.credential);
      
      // The server returns the user object with role and profiles
      onLogin({
        email: userData.email,
        name: userData.name || 'Student',
        role: userData.role.toLowerCase() as Role,
        dept: userData.studentProfile?.department || userData.staffProfile?.department || 'GENERAL',
      });
    } catch (err: any) {
      handleError(err.message || "Authentication failed. Please use your @smvec.ac.in ID.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = async () => {
    const id = identifyRole(email);
    if (!id) {
      handleError("Invalid college email. Ensure it follows SMVEC format.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.DEV ? 'http://localhost:5000' : ''}/api/auth/email`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      );
      const userData = await response.json();

      if (!response.ok) {
        handleError(userData.error || 'Authentication failed');
        return;
      }

      onLogin({
        email: userData.email,
        name: userData.name || email.split('@')[0],
        role: userData.role.toLowerCase() as Role,
        dept: userData.studentProfile?.department || userData.staffProfile?.department || id.dept,
      });
    } catch (err: any) {
      handleError(err.message || 'Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualLogin = () => {
    const savedPass = localStorage.getItem(`pass_${email}`);
    if (password === savedPass) {
      const id = identifyRole(email)!;
      onLogin({
        email,
        name: email.split('@')[0].replace('.', ' ').toUpperCase(),
        role: id.role,
        dept: id.dept
      });
    } else {
      handleError("Incorrect password.");
    }
  };

  const handleOtpVerify = () => {
    if (otp === '123456') {
      setStep('setup');
    } else {
      handleError("Invalid OTP. Use 123456 for testing.");
    }
  };

  const handleSetupPassword = () => {
    if (password.length < 6) {
      handleError("Password must be at least 6 characters.");
      return;
    }
    localStorage.setItem(`pass_${email}`, password);
    const id = identifyRole(email)!;
    onLogin({
      email,
      name: email.split('@')[0].replace('.', ' ').toUpperCase(),
      role: id.role,
      dept: id.dept
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Soft Background Accents */}
      <div className="absolute top-0 right-0 w-[50rem] h-[50rem] bg-indigo-100/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-slate-100 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-10">
          <motion.div 
            whileHover={{ rotate: 5, scale: 1.05 }}
            className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-100"
          >
            <span className="text-white font-black text-3xl">P</span>
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">PlacementOS</h1>
        </div>

        <Card className="border-none bg-white shadow-[0_20px_50px_rgba(79,70,229,0.08)] rounded-[2rem] overflow-hidden">
          <CardContent className="p-10">
            <AnimatePresence mode="wait">
              {step === 'email' && (
                <motion.div 
                  key="email-step"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Enter your mail id</label>
                       <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                          placeholder="Type Here"
                          className="pl-11 h-14 bg-slate-50 border-transparent focus:border-indigo-600 focus:bg-white text-slate-900 transition-all rounded-2xl text-lg tracking-tight"
                          value={email}
                          onChange={(e) => setEmail(e.target.value.toLowerCase())}
                          onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
                        />
                      </div>
                    </div>
                    <Button 
                      className="w-full h-14 text-md font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition-all shadow-lg shadow-indigo-100 group"
                      onClick={handleContinue}
                      disabled={isLoading}
                    >
                      {isLoading ? "Verifying..." : "Continue"}
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-300 tracking-[0.2em] bg-white px-4">OR</div>
                  </div>

                  <div className="flex justify-center">
                    <GoogleLogin 
                      onSuccess={handleGoogleSuccess}
                      onError={() => handleError("Google Login Failed")}
                      useOneTap
                      theme="outline"
                      shape="pill"
                      text="continue_with"
                      width="320px"
                    />
                  </div>
                </motion.div>
              )}

              {step === 'otp' && (
                <motion.div key="otp-step" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                   <div className="text-center">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <KeyRound className="text-indigo-600 w-6 h-6" />
                    </div>
                    <h3 className="text-slate-900 font-bold text-xl">Verification Code</h3>
                    <p className="text-slate-500 text-sm mt-1">Sent to {email}</p>
                  </div>
                  <Input 
                    placeholder="123456"
                    className="h-16 text-center text-3xl tracking-[0.5em] bg-slate-50 border-transparent focus:border-indigo-600 font-bold text-indigo-600 rounded-2xl"
                    value={otp}
                    maxLength={6}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                  <Button className="w-full h-14 bg-indigo-600 rounded-2xl font-bold" onClick={handleOtpVerify}>Verify Identity</Button>
                </motion.div>
              )}

              {step === 'setup' && (
                <motion.div key="setup-step" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-slate-900 font-bold text-xl">Set Password</h3>
                    <p className="text-slate-500 text-sm mt-1">Create a password for your account</p>
                  </div>
                  <Input 
                    type="password"
                    placeholder="Minimum 6 characters"
                    className="h-14 bg-slate-50 border-transparent focus:border-indigo-600 rounded-2xl"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button className="w-full h-14 bg-indigo-600 rounded-2xl font-bold" onClick={handleSetupPassword}>Save & Log In</Button>
                </motion.div>
              )}

              {step === 'password' && (
                <motion.div key="password-step" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-slate-900 font-bold text-xl">Identity Verified</h3>
                    <p className="text-slate-500 text-sm mt-1">Welcome back, {email.split('.')[0]}</p>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      type="password"
                      placeholder="Enter Password"
                      autoFocus
                      className="pl-11 h-14 bg-slate-50 border-transparent focus:border-indigo-600 rounded-2xl"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleManualLogin()}
                    />
                  </div>
                  <Button className="w-full h-14 bg-indigo-600 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100" onClick={handleManualLogin}>Authenticate</Button>
                  <button onClick={() => setStep('email')} className="w-full text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-indigo-600 transition-colors">Change Account</button>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold uppercase tracking-wide">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </CardContent>
        </Card>

        <div className="mt-12 flex items-center justify-center gap-6 opacity-40 grayscale">
           <div className="w-8 h-8 rounded-full border-2 border-slate-300" />
           <div className="w-10 h-10 rounded-xl border-2 border-slate-300" />
           <div className="w-8 h-8 rounded-full border-2 border-slate-300" />
        </div>
      </motion.div>
    </div>
  );
}

