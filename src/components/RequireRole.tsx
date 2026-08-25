import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

/**
 * Route guard for internal/staff surfaces.
 *
 * Several admin pages were mounted as plain public routes: /radio/library
 * (upload UI for the station audio library), /notes (a Supabase-backed private
 * notepad), /changes and /draft (internal scratchpads), and /whats-on-agent
 * (an AI console). Anyone who knew the URL could open them.
 *
 * This is a UI guard, not the security boundary. RLS on the database is what
 * actually stops a request; this just stops the page rendering and stops
 * pointless failing queries firing from an unauthenticated browser.
 */
export const RequireRole: React.FC<{
  roles: Exclude<UserRole, null>[];
  children: React.ReactNode;
}> = ({ roles, children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-olive/30 border-t-brand-olive rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ message: 'Please sign in to continue.' }} />;
  }

  // profiles.is_admin is a superset of any named role.
  const permitted = user.isAdmin || (user.role !== null && roles.includes(user.role));

  if (!permitted) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-serif mb-4">Staff access only</h1>
          <p className="text-brand-ink/60">
            This area is for The Farmers Table Hub team. If you think you should have access,
            ask the founder to update your role.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
