import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { LogIn, User, ShieldCheck, Store } from 'lucide-react';
import { motion } from 'motion/react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole) {
      login(selectedRole);
      navigate('/dashboard');
    }
  };

  return (
    <div className="py-16 md:py-24 bg-brand-cream min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full px-4">
        <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm border border-brand-olive/5 text-center">
          <div className="w-16 h-16 bg-brand-cream rounded-2xl flex items-center justify-center text-brand-olive mx-auto mb-8">
            <LogIn size={32} />
          </div>
          <h1 className="text-3xl font-serif mb-2">Welcome Back</h1>
          <p className="text-brand-ink/60 mb-12">Select your access level to continue</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 mb-8">
              <button
                type="button"
                onClick={() => setSelectedRole('founder')}
                className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                  selectedRole === 'founder' ? 'border-brand-olive bg-brand-olive/5' : 'border-brand-cream hover:border-brand-olive/20'
                }`}
              >
                <ShieldCheck className={selectedRole === 'founder' ? 'text-brand-olive' : 'text-brand-ink/40'} />
                <div className="text-left">
                  <span className="block font-bold">Founder Access</span>
                  <span className="text-xs opacity-50">Full site management</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('staff')}
                className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                  selectedRole === 'staff' ? 'border-brand-olive bg-brand-olive/5' : 'border-brand-cream hover:border-brand-olive/20'
                }`}
              >
                <User className={selectedRole === 'staff' ? 'text-brand-olive' : 'text-brand-ink/40'} />
                <div className="text-left">
                  <span className="block font-bold">Staff Access</span>
                  <span className="text-xs opacity-50">Tasks & notes</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('customer')}
                className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                  selectedRole === 'customer' ? 'border-brand-olive bg-brand-olive/5' : 'border-brand-cream hover:border-brand-olive/20'
                }`}
              >
                <Store className={selectedRole === 'customer' ? 'text-brand-olive' : 'text-brand-ink/40'} />
                <div className="text-left">
                  <span className="block font-bold">Customer Access</span>
                  <span className="text-xs opacity-50">Manage your listings</span>
                </div>
              </button>
            </div>

            <button
              type="submit"
              disabled={!selectedRole}
              className="w-full py-5 bg-brand-olive text-white rounded-full font-bold hover:bg-brand-olive/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
