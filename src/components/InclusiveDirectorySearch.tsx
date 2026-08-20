import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Search } from 'lucide-react';

interface InclusiveDirectorySearchProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

export const InclusiveDirectorySearch: React.FC<InclusiveDirectorySearchProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search by name, food, category, area or describe what you need…',
}) => {
  const [listening, setListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const SpeechRecognitionCtor = typeof window !== 'undefined'
    ? (window as SpeechWindow).SpeechRecognition || (window as SpeechWindow).webkitSpeechRecognition
    : undefined;

  useEffect(() => () => {
    recognitionRef.current?.stop();
  }, []);

  const toggleVoice = () => {
    if (!SpeechRecognitionCtor) {
      setVoiceMessage('Voice search is not available in this browser. You can still type your search.');
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-GB';
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0]?.transcript || '')
        .join(' ')
        .trim();
      if (transcript) onChange(transcript);
    };
    recognition.onerror = () => {
      setListening(false);
      setVoiceMessage('We could not hear that. Please try again, or type your search.');
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    setVoiceMessage('Listening… speak your search.');
    setListening(true);
    recognition.start();
  };

  return (
    <div className="w-full" role="search" aria-label="Farmers Table directory search">
      <div className="relative flex items-center">
        <Search aria-hidden="true" className="absolute left-4 text-brand-ink/30" size={20} />
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onSubmit?.();
          }}
          placeholder={placeholder}
          aria-label="Search the Farmers Table directory"
          className="w-full pl-12 pr-14 py-4 rounded-2xl bg-brand-cream/50 border-none focus:ring-2 focus:ring-brand-olive/20 text-lg"
        />
        <button
          type="button"
          onClick={toggleVoice}
          aria-label={listening ? 'Stop voice search' : 'Start voice search'}
          aria-pressed={listening}
          title={listening ? 'Stop listening' : 'Search by voice'}
          className={`absolute right-2 p-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-brand-olive/40 ${listening ? 'bg-brand-olive text-white' : 'text-brand-olive hover:bg-brand-olive/10'}`}
        >
          {listening ? <MicOff size={20} aria-hidden="true" /> : <Mic size={20} aria-hidden="true" />}
        </button>
      </div>
      <div className="min-h-6 mt-2" aria-live="polite">
        {voiceMessage && <p className="text-xs text-brand-ink/50">{voiceMessage}</p>}
      </div>
    </div>
  );
};
