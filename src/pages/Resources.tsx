import React, { useState, useEffect } from 'react';
import { generateCommunityContent } from '../services/geminiService';
import { motion } from 'motion/react';
import { Sparkles, Calendar, Mail, BookOpen, RefreshCw, Loader2 } from 'lucide-react';

interface GeneratedContent {
  events: Array<{ title: string, description: string, date: string }>;
  welcomeMessage: string;
  blogIdeas: Array<{ title: string, summary: string }>;
}

export const Resources: React.FC = () => {
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const result = await generateCommunityContent();
    if (result) {
      setContent(result);
    }
    setLoading(false);
  };

  useEffect(() => {
    handleGenerate();
  }, []);

  return (
    <div className="py-16 md:py-24 bg-brand-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
          <div>
            <h1 className="text-5xl md:text-7xl font-serif mb-6">Community <span className="italic text-brand-olive">Resources</span></h1>
            <p className="text-xl text-brand-ink/70 max-w-2xl">
              AI-generated content ideas to help you engage with the Farnham community.
            </p>
          </div>
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 px-8 py-4 bg-brand-olive text-white rounded-full font-bold hover:bg-brand-olive/90 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
            {loading ? 'Generating...' : 'Regenerate Content'}
          </button>
        </div>

        {!content && loading && (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="animate-spin text-brand-olive" size={48} />
            <p className="text-xl font-serif italic text-brand-ink/50">Crafting community content...</p>
          </div>
        )}

        {content && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Event Descriptions */}
            <section className="space-y-8">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="text-brand-olive" size={28} />
                <h2 className="text-3xl font-serif">Sample Event Descriptions</h2>
              </div>
              <div className="space-y-6">
                {content.events.map((event, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white p-8 rounded-[32px] border border-brand-olive/5 shadow-sm"
                  >
                    <span className="text-xs font-bold uppercase tracking-widest text-brand-olive/60 mb-2 block">{event.date}</span>
                    <h3 className="text-2xl font-serif mb-4">{event.title}</h3>
                    <p className="text-brand-ink/70 leading-relaxed">{event.description}</p>
                  </motion.div>
                ))}
              </div>
            </section>

            <div className="space-y-12">
              {/* Welcome Message */}
              <section className="space-y-8">
                <div className="flex items-center gap-3 mb-4">
                  <Mail className="text-brand-olive" size={28} />
                  <h2 className="text-3xl font-serif">Welcome Message Template</h2>
                </div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-brand-olive text-brand-cream p-8 md:p-12 rounded-[40px] shadow-xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16"></div>
                  <div className="relative z-10">
                    <pre className="whitespace-pre-wrap font-sans text-lg leading-relaxed opacity-90">
                      {content.welcomeMessage}
                    </pre>
                    <button 
                      onClick={() => navigator.clipboard.writeText(content.welcomeMessage)}
                      className="mt-8 px-6 py-2 bg-white/20 hover:bg-white/30 rounded-full text-sm font-bold transition-all"
                    >
                      Copy to Clipboard
                    </button>
                  </div>
                </motion.div>
              </section>

              {/* Blog Post Ideas */}
              <section className="space-y-8">
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="text-brand-olive" size={28} />
                  <h2 className="text-3xl font-serif">Blog Post Ideas</h2>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {content.blogIdeas.map((idea, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white p-6 rounded-2xl border border-brand-olive/5 hover:border-brand-olive/20 transition-all group"
                    >
                      <h4 className="font-bold text-lg mb-2 group-hover:text-brand-olive transition-colors">{idea.title}</h4>
                      <p className="text-sm text-brand-ink/60">{idea.summary}</p>
                    </motion.div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
