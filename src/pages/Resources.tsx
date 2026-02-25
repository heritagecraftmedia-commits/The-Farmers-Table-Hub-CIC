import React from 'react';
import { Book, Download, ExternalLink, Shield, FileText, Video } from 'lucide-react';

export const Resources: React.FC = () => {
  const resources = [
    {
      category: 'Legal & Ethical',
      items: [
        { title: 'GDPR for Small Producers', type: 'PDF', icon: <Shield size={20} /> },
        { title: 'Ethical Monetisation Charter', type: 'Doc', icon: <FileText size={20} /> },
        { title: 'Privacy Policy Template', type: 'PDF', icon: <Shield size={20} /> },
      ]
    },
    {
      category: 'Marketing & Radio',
      items: [
        { title: 'Radio Interview Guide', type: 'Video', icon: <Video size={20} /> },
        { title: 'Social Media Assets Pack', type: 'ZIP', icon: <Download size={20} /> },
        { title: 'How to write your Maker Story', type: 'Guide', icon: <Book size={20} /> },
      ]
    }
  ];

  return (
    <div className="py-16 md:py-24 bg-brand-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-16">
          <h1 className="text-5xl md:text-7xl font-serif mb-6">Resource <span className="italic text-brand-olive">Library</span></h1>
          <p className="text-xl text-brand-ink/70 leading-relaxed">
            Everything you need to grow your artisan business and stay compliant. Free for all Hub members.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {resources.map((section) => (
            <div key={section.category} className="space-y-8">
              <h2 className="text-2xl font-serif border-b border-brand-olive/10 pb-4">{section.category}</h2>
              <div className="space-y-4">
                {section.items.map((item) => (
                  <div key={item.title} className="bg-white p-6 rounded-3xl border border-brand-olive/5 shadow-sm flex items-center justify-between group hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-brand-cream rounded-xl flex items-center justify-center text-brand-olive">
                        {item.icon}
                      </div>
                      <div>
                        <h3 className="font-bold">{item.title}</h3>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{item.type}</span>
                      </div>
                    </div>
                    <ExternalLink size={18} className="text-brand-ink/20 group-hover:text-brand-olive transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-24 p-12 bg-white rounded-[40px] border border-brand-olive/5 text-center">
          <h3 className="text-2xl font-serif mb-4">Can't find what you're looking for?</h3>
          <p className="text-brand-ink/60 mb-8">Suggest a resource or ask for a specific guide and our team will look into it.</p>
          <button className="px-8 py-3 bg-brand-olive text-white rounded-full font-bold text-sm">Request Resource</button>
        </div>
      </div>
    </div>
  );
};
