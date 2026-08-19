import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Printer, QrCode, Save, RotateCcw, ArrowLeft } from 'lucide-react';

const questions = [
  'What do you think of the Farmers Table idea overall?',
  'What part of the idea do you like most?',
  'What concerns, weaknesses or risks can you see?',
  'What would make you more likely to use, support or recommend it?',
  'Who do you think would benefit most from it?',
  'What have I missed?',
  'What should we absolutely NOT do?',
  'Any other comments, ideas or introductions?',
];

export const PracticeWorkbook: React.FC = () => {
  const [name, setName] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [answers, setAnswers] = useState<string[]>(questions.map(() => ''));
  const [overall, setOverall] = useState('');

  const updateAnswer = (index: number, value: string) => {
    setAnswers((current) => current.map((answer, i) => (i === index ? value : answer)));
  };

  const saveDraft = () => {
    localStorage.setItem('farmers-table-practice-workbook', JSON.stringify({ name, organisation, date, overall, answers }));
    window.alert('Workbook saved on this device.');
  };

  const reset = () => {
    if (!window.confirm('Clear this workbook and start again?')) return;
    setName('');
    setOrganisation('');
    setOverall('');
    setAnswers(questions.map(() => ''));
  };

  return (
    <div className="bg-brand-cream min-h-screen py-10 md:py-16 print:bg-white print:py-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 mb-8 print:hidden">
          <Link to="/" className="inline-flex items-center gap-2 text-brand-olive font-bold"><ArrowLeft size={18} /> Back to Hub</Link>
          <div className="flex gap-2">
            <button onClick={saveDraft} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-brand-olive/20 font-bold"><Save size={16} /> Save</button>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-olive text-white font-bold"><Printer size={16} /> Print</button>
          </div>
        </div>

        <section className="bg-white rounded-[32px] p-7 md:p-12 shadow-sm border border-brand-olive/10">
          <div className="text-center border-b border-brand-olive/10 pb-8 mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-olive/60 mb-3">Farmers Table CIC</p>
            <h1 className="text-4xl md:text-6xl font-serif">Practice Feedback <span className="italic text-brand-olive">Workbook</span></h1>
            <p className="mt-4 text-lg text-brand-ink/65 max-w-2xl mx-auto">I'm throwing out an idea. Please tell me what you really think — good, bad, doubtful or brilliant. Nothing is off limits.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mb-8">
            <label className="font-bold text-sm">Name (optional)<input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-xl border border-brand-olive/15 p-3 font-normal" /></label>
            <label className="font-bold text-sm">Organisation / role<input value={organisation} onChange={(e) => setOrganisation(e.target.value)} className="mt-2 w-full rounded-xl border border-brand-olive/15 p-3 font-normal" /></label>
            <label className="font-bold text-sm">Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-2 w-full rounded-xl border border-brand-olive/15 p-3 font-normal" /></label>
          </div>

          <div className="bg-brand-cream rounded-2xl p-5 mb-8">
            <p className="font-bold mb-3">Overall reaction</p>
            <div className="flex flex-wrap gap-2">
              {['Strongly positive', 'Positive', 'Mixed', 'Unsure', 'Concerned', 'Not for me'].map((option) => (
                <button key={option} type="button" onClick={() => setOverall(option)} className={`px-4 py-2 rounded-full border font-bold text-sm ${overall === option ? 'bg-brand-olive text-white border-brand-olive' : 'bg-white border-brand-olive/15'}`}>{option}</button>
              ))}
            </div>
          </div>

          <div className="space-y-7">
            {questions.map((question, index) => (
              <div key={question} className="break-inside-avoid">
                <label className="block font-bold text-lg mb-2"><span className="text-brand-olive mr-2">{index + 1}.</span>{question}</label>
                <textarea value={answers[index]} onChange={(e) => updateAnswer(index, e.target.value)} rows={4} className="w-full rounded-2xl border border-brand-olive/15 p-4 resize-y" placeholder="Notes..." />
              </div>
            ))}
          </div>

          <div className="mt-10 pt-8 border-t border-brand-olive/10 flex flex-col md:flex-row md:items-center md:justify-between gap-5 print:hidden">
            <div className="text-sm text-brand-ink/60"><strong>Be honest.</strong> A useful criticism is worth as much as a compliment.</div>
            <div className="flex gap-2">
              <button onClick={reset} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-olive/20 font-bold"><RotateCcw size={16} /> Clear</button>
              <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-brand-olive text-white font-bold"><Printer size={16} /> Print completed sheet</button>
            </div>
          </div>
        </section>

        <section className="mt-8 bg-white rounded-[28px] p-7 border border-brand-olive/10 print:hidden">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <img className="w-40 h-40 rounded-2xl border border-brand-olive/10" alt="QR code for the digital Farmers Table feedback workbook" src="https://quickchart.io/qr?size=240&text=https%3A%2F%2Fthe-farmers-table-hub-cic.vercel.app%2Fworkbook" />
            <div>
              <div className="flex items-center gap-2 text-brand-olive font-bold mb-2"><QrCode size={20} /> QR code for the room</div>
              <h2 className="text-2xl font-serif mb-2">Scan this and fill it in digitally</h2>
              <p className="text-brand-ink/65">Put this QR code on the printed pack, handout or table. People can open the workbook on their phone without needing the long address.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
