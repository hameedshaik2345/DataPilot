import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Trash2, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';

const Insights = () => {
    const [insights, setInsights] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const res = await api.get('/insights');
                setInsights(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchInsights();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this insight?')) return;
        try {
            await api.delete(`/insights/${id}`);
            setInsights(insights.filter(i => i.id !== id));
        } catch (err) {
            alert('Failed to delete');
        }
    };

    if (loading) return <div className="p-8 text-slate-400">Loading insights...</div>;

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
            <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 shrink-0">
                    <Lightbulb className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Saved Insights</h1>
                    <p className="text-sm md:text-base text-slate-400">Important charts and findings saved from your analyses.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {insights.map(insight => (
                    <div key={insight.id} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden flex flex-col shadow-lg">
                        <div className="p-4 border-b border-slate-700 bg-slate-800/80 flex justify-between items-start">
                            <div className="overflow-hidden">
                                <h3 className="font-semibold text-white truncate" title={insight.title}>{insight.title}</h3>
                                <p className="text-xs text-slate-400 mt-1 truncate">Query: "{insight.original_query}"</p>
                            </div>
                            <button onClick={() => handleDelete(insight.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md shrink-0">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="p-4 flex-1 bg-slate-900/50 flex flex-col justify-center items-center">
                            {insight.visualization_configuration ? (
                                <img src={`data:image/png;base64,${insight.visualization_configuration}`} alt="Insight Chart" className="rounded-lg w-full" />
                            ) : insight.analysis_result ? (
                                <div className="text-xs text-slate-300 overflow-x-auto w-full p-2 bg-slate-800 rounded-lg">
                                    <pre>{JSON.stringify(insight.analysis_result, null, 2)}</pre>
                                </div>
                            ) : (
                                <div className="text-slate-500 text-sm">No visual data</div>
                            )}
                        </div>
                        
                        <div className="p-3 bg-slate-800 border-t border-slate-700 text-xs text-slate-500 flex justify-between items-center">
                            <span>Saved on {new Date(insight.created_at).toLocaleDateString()}</span>
                            <Link to={`/datasets/${insight.dataset_id}/analyze`} className="text-indigo-400 hover:text-indigo-300 font-medium">
                                Go to Dataset
                            </Link>
                        </div>
                    </div>
                ))}
                
                {insights.length === 0 && (
                    <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-700 rounded-2xl">
                        <Lightbulb className="w-12 h-12 mb-4 text-slate-600" />
                        <p className="text-lg font-medium mb-2">No insights yet</p>
                        <p className="text-sm text-slate-500">Save insights from your analytics workspace to see them here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Insights;
