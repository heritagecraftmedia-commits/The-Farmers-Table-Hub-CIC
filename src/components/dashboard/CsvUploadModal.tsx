import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CsvUploadModalProps {
    onClose: () => void;
    onImport: (target: 'food' | 'makers', data: Record<string, string>[]) => void;
}

export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({ onClose, onImport }) => {
    const [target, setTarget] = useState<'food' | 'makers'>('food');
    const [rows, setRows] = useState<Record<string, string>[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [fileName, setFileName] = useState('');
    const [error, setError] = useState('');
    const [imported, setImported] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const parseCSV = (text: string) => {
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) { setError('File has no data rows'); return; }
        const hdrs = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        setHeaders(hdrs);
        const data = lines.slice(1).map(line => {
            const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const obj: Record<string, string> = {};
            hdrs.forEach((h, i) => { obj[h] = vals[i] || ''; });
            return obj;
        });
        setRows(data);
        setError('');
    };

    const handleFile = (file: File) => {
        setFileName(file.name);
        if (!file.name.endsWith('.csv')) {
            setError('Please upload a .csv file. You can export from Google Sheets via File → Download → CSV.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => parseCSV(e.target?.result as string);
        reader.readAsText(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const handleImport = () => {
        onImport(target, rows);
        setImported(true);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-[32px] p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-serif">Upload CSV</h2>
                        <p className="text-sm text-brand-ink/50">Import vendors or makers from a spreadsheet</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-brand-cream flex items-center justify-center hover:bg-brand-olive/10">
                        <X size={18} />
                    </button>
                </div>

                {imported ? (
                    <div className="text-center py-12">
                        <Check size={48} className="text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-serif mb-2">Import Complete</h3>
                        <p className="text-brand-ink/50">{rows.length} records imported to {target === 'food' ? 'Food Directory' : 'Makers Hub'}</p>
                        <button onClick={onClose} className="mt-6 px-6 py-3 bg-brand-olive text-white rounded-full font-bold text-sm">Done</button>
                    </div>
                ) : (
                    <>
                        {/* Target selector */}
                        <div className="mb-6">
                            <p className="text-sm font-bold mb-2">Import into:</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setTarget('food')}
                                    className={`flex-1 p-4 rounded-2xl border-2 text-left transition-all ${target === 'food' ? 'border-brand-olive bg-brand-olive/5' : 'border-brand-olive/10 hover:border-brand-olive/30'}`}
                                >
                                    <span className="text-lg">🥬</span>
                                    <p className="font-bold text-sm mt-1">Food Directory</p>
                                    <p className="text-[11px] text-brand-ink/40">Farms, producers, food vendors</p>
                                </button>
                                <button
                                    onClick={() => setTarget('makers')}
                                    className={`flex-1 p-4 rounded-2xl border-2 text-left transition-all ${target === 'makers' ? 'border-brand-olive bg-brand-olive/5' : 'border-brand-olive/10 hover:border-brand-olive/30'}`}
                                >
                                    <span className="text-lg">🎨</span>
                                    <p className="font-bold text-sm mt-1">Makers Hub</p>
                                    <p className="text-[11px] text-brand-ink/40">Artists, craftspeople, artisans</p>
                                </button>
                            </div>
                        </div>

                        {/* Drop zone */}
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            className="border-2 border-dashed border-brand-olive/20 rounded-2xl p-8 text-center mb-6 hover:border-brand-olive/40 transition-all cursor-pointer"
                            onClick={() => fileRef.current?.click()}
                        >
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
                            />
                            <FileSpreadsheet size={32} className="text-brand-olive/40 mx-auto mb-3" />
                            {fileName ? (
                                <p className="font-bold text-sm">{fileName}</p>
                            ) : (
                                <>
                                    <p className="font-bold text-sm mb-1">Drag & drop a CSV file here</p>
                                    <p className="text-xs text-brand-ink/40">or click to browse</p>
                                </>
                            )}
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-xl">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        {/* Preview */}
                        {rows.length > 0 && (
                            <div className="mb-6">
                                <p className="text-sm font-bold mb-2">Preview ({rows.length} rows, {headers.length} columns)</p>
                                <div className="overflow-x-auto rounded-xl border border-brand-olive/10">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="bg-brand-cream/50">
                                                {headers.map(h => (
                                                    <th key={h} className="px-3 py-2 text-left font-bold text-brand-ink/60 whitespace-nowrap">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.slice(0, 5).map((row, i) => (
                                                <tr key={i} className="border-t border-brand-olive/5">
                                                    {headers.map(h => (
                                                        <td key={h} className="px-3 py-2 text-brand-ink/70 whitespace-nowrap max-w-[200px] truncate">{row[h]}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {rows.length > 5 && <p className="text-[11px] text-brand-ink/30 mt-1">Showing first 5 of {rows.length} rows</p>}
                            </div>
                        )}

                        {/* Import button */}
                        {rows.length > 0 && (
                            <button
                                onClick={handleImport}
                                className="w-full py-4 bg-brand-olive text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-olive/90 transition-all"
                            >
                                <Upload size={18} />
                                Import {rows.length} records to {target === 'food' ? 'Food Directory' : 'Makers Hub'}
                            </button>
                        )}
                    </>
                )}
            </motion.div>
        </div>
    );
};
