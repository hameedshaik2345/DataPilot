import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Upload, Send, BarChart2, Info, CheckCircle, Table, BrainCircuit, Bot, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = 'http://localhost:8000';

type Message = {
  role: 'user' | 'ai';
  text: string;
  image?: string;
  data?: any;
};

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Hello! I am DataPilot AI. Upload a business dataset (CSV) and let\'s discover some patterns together!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/upload`, formData);
      setColumns(res.data.columns);
      setMessages(prev => [...prev, {
        role: 'ai',
        text: `Loaded ${selectedFile.name} (${res.data.rows} rows). Ready for analysis!`
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Upload failed. Please check the file format.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !file) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('query', userMsg);
      const res = await axios.post(`${API_BASE}/chat`, formData);

      setMessages(prev => [...prev, {
        role: 'ai',
        text: res.data.response,
        image: res.data.image,
        data: res.data.data
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Error communicating with the analysis engine.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-slate-200 font-['Inter'] selection:bg-indigo-500/30">
      <div className="w-full h-screen px-6 py-6 flex flex-col">
        {/* Nav */}
        <nav className="flex justify-between items-center mb-8 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <BrainCircuit className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">DataPilot <span className="text-indigo-400">AI</span></h1>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mt-1">Smart CSV Intelligence</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> ENGINE ACTIVE
            </div>
          </div>
        </nav>

        <div className="flex-grow flex flex-col lg:flex-row gap-6 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-full lg:w-80 flex flex-col gap-4 shrink-0">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
              <h3 className="text-base font-semibold text-slate-400 mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5" /> DATASET
              </h3>
              <div className="relative group cursor-pointer">
                <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${file ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-slate-800 group-hover:border-slate-700'}`}>
                  {file ? (
                    <div>
                      <CheckCircle className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
                      <p className="text-sm font-medium text-slate-300 truncate">{file.name}</p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                      <p className="text-sm text-slate-500">Drop your CSV here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {columns.length > 0 && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex-grow overflow-hidden flex flex-col backdrop-blur-sm">
                <h3 className="text-base font-semibold text-slate-400 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5" /> SCHEMA
                </h3>
                <div className="overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {columns.map(col => (
                    <div key={col} className="px-3 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-indigo-500/50" />
                      <span className="truncate">{col}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Main Chat Area */}
          <section className="flex-grow flex flex-col bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm shadow-2xl">
            <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
              <AnimatePresence initial={false}>
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex w-full mb-8 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      {msg.role === 'ai' && (
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-1 shadow-lg shadow-indigo-500/10">
                          <Bot className="w-5 h-5 text-indigo-400" />
                        </div>
                      )}
                      <div className={`${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tl-2xl rounded-tr-md rounded-bl-2xl rounded-br-2xl' : 'bg-slate-800 text-slate-200 rounded-tr-2xl rounded-tl-md rounded-br-2xl rounded-bl-2xl'} px-6 py-4 shadow-lg border border-white/5 min-w-[50px] break-words flex flex-col`}>
                        <p className="text-base leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>

                        {msg.image && (
                          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-3 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 relative group">
                            <img src={`data:image/png;base64,${msg.image}`} alt="Visualization" className="w-full h-auto" />
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <a
                                href={`data:image/png;base64,${msg.image}`}
                                download={`datapilot_graph_${Date.now()}.png`}
                                className="bg-indigo-600/90 hover:bg-indigo-500 text-white p-2 rounded-lg flex items-center gap-2 text-xs font-semibold backdrop-blur-sm shadow-lg border border-indigo-500/50 transition-all active:scale-95 cursor-pointer"
                              >
                                <Download className="w-4 h-4" /> Download
                              </a>
                            </div>
                          </motion.div>
                        )}

                        {msg.data && (
                          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-700 bg-slate-950/50 p-1">
                            <table className="w-full text-xs text-left border-collapse">
                              <thead>
                                <tr className="border-b border-slate-800 text-slate-500 uppercase">
                                  <th className="p-2">Metric</th>
                                  {Object.keys(msg.data).slice(0, 5).map(k => <th key={k} className="p-2">{k}</th>)}
                                </tr>
                              </thead>
                              <tbody>
                                {['count', 'mean', 'std', 'min', 'max'].map(stat => (
                                  <tr key={stat} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                    <td className="p-2 font-bold text-indigo-400 capitalize">{stat}</td>
                                    {Object.keys(msg.data).slice(0, 5).map(k => (
                                      <td key={k} className="p-2 text-slate-300">
                                        {typeof msg.data[k][stat] === 'number' ? msg.data[k][stat].toLocaleString(undefined, { maximumFractionDigits: 2 }) : '-'}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {Object.keys(msg.data).length > 5 && <p className="text-[9px] text-slate-600 p-2 italic text-center">Showing first 5 columns</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {loading && (
                <div className="flex gap-2 p-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 bg-slate-900/80 border-t border-slate-800">
              <div className="relative w-full flex gap-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={file ? "Ask about patterns, top products, or distributions..." : "Upload a CSV to start analyzing..."}
                  disabled={!file || loading}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-6 px-6 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-lg placeholder:text-slate-600 shadow-inner resize-none custom-scrollbar leading-relaxed"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!file || !input.trim() || loading}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-2xl px-8 transition-all flex items-center justify-center shadow-lg shadow-indigo-600/20 active:scale-95 shrink-0"
                >
                  <Send className="w-6 h-6" />
                </button>
              </div>
              <p className="text-[10px] text-slate-600 text-center mt-3 uppercase tracking-widest font-medium">Powering Business Intelligence through LLM Orchestration</p>
            </div>
          </section>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>
    </div>
  );
}

export default App;
