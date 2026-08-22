import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Send, Save, ArrowLeft, Bot, User, TableProperties } from 'lucide-react';
import { Link } from 'react-router-dom';

const AnalyticsWorkspace = () => {
    const { datasetId } = useParams();
    const [searchParams] = useSearchParams();
    const sessionIdParam = searchParams.get('session');
    
    const [dataset, setDataset] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [query, setQuery] = useState('');
    const [sessionId, setSessionId] = useState<string | null>(sessionIdParam);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const init = async () => {
            try {
                const dsRes = await api.get(`/datasets/${datasetId}`);
                setDataset(dsRes.data);
                
                if (sessionId) {
                    const msgRes = await api.get(`/analysis/sessions/${sessionId}/messages`);
                    setMessages(msgRes.data);
                }
            } catch (err) {
                console.error("Failed to load workspace", err);
            }
        };
        init();
    }, [datasetId, sessionId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        const newQuery = query;
        setQuery('');
        
        // Optimistic UI for user message
        const tempMsg = { id: Date.now(), role: 'user', content: newQuery };
        setMessages(prev => [...prev, tempMsg]);
        setLoading(true);

        try {
            const res = await api.post('/analysis/chat', {
                dataset_id: datasetId,
                session_id: sessionId,
                query: newQuery
            });
            
            if (!sessionId) {
                setSessionId(res.data.session_id);
            }
            
            // Reload messages from server to get accurate state including charts
            const msgRes = await api.get(`/analysis/sessions/${res.data.session_id}/messages`);
            setMessages(msgRes.data);
        } catch (err: any) {
            alert(err.response?.data?.detail || "Chat failed");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveInsight = async (msg: any) => {
        const originalQueryMsg = messages[messages.findIndex(m => m.id === msg.id) - 1];
        try {
            await api.post('/insights', {
                dataset_id: datasetId,
                title: originalQueryMsg?.content.substring(0, 50) || "Saved Insight",
                original_query: originalQueryMsg?.content || "N/A",
                analysis_result: msg.result,
                visualization_configuration: msg.visualization
            });
            alert("Insight saved successfully!");
        } catch (err) {
            alert("Failed to save insight");
        }
    };

    if (!dataset) return <div className="p-8 text-slate-400">Loading workspace...</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-73px)]">
            <div className="bg-slate-800 border-b border-slate-700 p-3 sm:p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2 sm:gap-4">
                    <Link to="/datasets" className="p-1 sm:p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="truncate">
                        <h2 className="text-base sm:text-lg font-bold text-white truncate">{dataset.display_name}</h2>
                        <div className="text-xs text-slate-400">{dataset.row_count} rows • {dataset.column_count} cols</div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-6 bg-slate-900/50">
                {messages.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                        <TableProperties className="w-16 h-16 mb-4 text-slate-700" />
                        <h3 className="text-xl font-medium text-slate-300 mb-2">Analyze {dataset.display_name}</h3>
                        <p className="max-w-md text-center text-sm">Ask questions about your data in plain English. I can generate summaries or create charts like bar, line, pie, and scatter plots.</p>
                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                            {["Show me a summary of the data", "Generate a bar chart of Category vs Sales", "What is the distribution of Revenue?"].map(q => (
                                <button key={q} onClick={() => setQuery(q)} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm text-slate-300 px-4 py-2 rounded-full transition-colors">
                                    "{q}"
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                {messages.map((msg, i) => (
                    <div key={msg.id || i} className={`flex gap-4 max-w-4xl ${msg.role === 'user' ? 'ml-auto' : ''}`}>
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 mt-1 border border-indigo-500/30">
                                <Bot className="w-5 h-5" />
                            </div>
                        )}
                        
                        <div className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md' : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-sm shadow-sm'}`}>
                            <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                            
                            {msg.result && (
                                <div className="mt-4 p-4 bg-slate-900 rounded-xl text-xs overflow-x-auto border border-slate-700">
                                    <pre>{JSON.stringify(msg.result, null, 2)}</pre>
                                </div>
                            )}
                            
                            {msg.visualization && (
                                <div className="mt-4">
                                    <img src={`data:image/png;base64,${msg.visualization}`} alt="Chart" className="rounded-xl border border-slate-700 w-full" />
                                </div>
                            )}

                            {msg.role === 'assistant' && (msg.result || msg.visualization) && (
                                <button 
                                    onClick={() => handleSaveInsight(msg)}
                                    className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    <Save className="w-4 h-4" /> Save Insight
                                </button>
                            )}
                        </div>

                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-1">
                                <User className="w-5 h-5" />
                            </div>
                        )}
                    </div>
                ))}
                
                {loading && (
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 mt-1">
                            <Bot className="w-5 h-5" />
                        </div>
                        <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                            <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-slate-800 border-t border-slate-700">
                <form onSubmit={handleSend} className="max-w-4xl mx-auto relative">
                    <input 
                        type="text" 
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Ask a question about your data..." 
                        className="w-full bg-slate-900 border border-slate-600 rounded-full py-3 pl-6 pr-14 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner"
                        disabled={loading}
                    />
                    <button 
                        type="submit" 
                        disabled={loading || !query.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white p-2 rounded-full transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AnalyticsWorkspace;
