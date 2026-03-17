import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users } from 'lucide-react';

export const MembersArea: React.FC = () => (
  <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4">
    <div className="text-center max-w-md">
      <div className="w-16 h-16 rounded-full bg-brand-olive/10 flex items-center justify-center mx-auto mb-8">
        <Users size={28} className="text-brand-olive" />
      </div>
      <h1 className="text-4xl font-serif mb-4">Members Area</h1>
      <p className="text-brand-ink/60 mb-3">Your private space for community updates, resources, and member-only content.</p>
      <p className="text-sm font-bold text-brand-olive mb-10">Coming Soon — check back shortly.</p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-8 py-4 bg-brand-olive text-white rounded-full font-bold hover:bg-brand-olive/90 transition-all"
      >
        Back to Home <ArrowRight size={18} />
      </Link>
    </div>
  </div>
);
