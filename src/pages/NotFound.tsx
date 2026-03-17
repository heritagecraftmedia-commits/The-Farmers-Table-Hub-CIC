import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const NotFound: React.FC = () => (
  <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4">
    <div className="text-center max-w-md">
      <p className="text-8xl font-serif text-brand-olive mb-6">404</p>
      <h1 className="text-3xl font-serif mb-4">Page not found</h1>
      <p className="text-brand-ink/60 mb-10">
        That page doesn't exist. It may have moved, or the URL might be wrong.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-8 py-4 bg-brand-olive text-white rounded-full font-bold hover:bg-brand-olive/90 transition-all"
      >
        Back to Home <ArrowRight size={18} />
      </Link>
    </div>
  </div>
);
