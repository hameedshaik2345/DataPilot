import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Database, Activity, Lightbulb, ArrowRight, Clock, FileSpreadsheet } from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState({ datasets: 0, sessions: 0, insights: 0 });
    const [recentDatasets, setRecentDatasets] = useState<any[]>([]);
    const [recentSessions, setRecentSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [datasetsRes, sessionsRes, insightsRes] = await Promise.all([
                    api.get('/datasets'),
                    api.get('/analysis/sessions'),
                    api.get('/insights')
                ]);

                const datasets = datasetsRes.data;
                const sessions = sessionsRes.data;
                
                setStats({
                    datasets: datasets.length,
                    sessions: sessions.length,
                    insights: insightsRes.data.length
                });

                setRecentDatasets(datasets.slice(0, 3));
                setRecentSessions(sessions.slice(0, 3));
            } catch (error) {
                console.error("Error fetching dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return <div className="p-8 text-slate-400">Loading dashboard...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-6 md:mb-8">Dashboard</h1>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-sm flex items-center gap-6 hover:border-indigo-500/50 transition-colors">
                    <div className="w-14 h-14 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                        <Database className="w-7 h-7" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-slate-400 mb-1">Total Datasets</div>
                        <div className="text-3xl font-bold text-white">{stats.datasets}</div>
                    </div>
                </div>
                
                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-sm flex items-center gap-6 hover:border-emerald-500/50 transition-colors">
                    <div className="w-14 h-14 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                        <Activity className="w-7 h-7" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-slate-400 mb-1">Analyses Run</div>
                        <div className="text-3xl font-bold text-white">{stats.sessions}</div>
                    </div>
                </div>

                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-sm flex items-center gap-6 hover:border-amber-500/50 transition-colors">
                    <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400">
                        <Lightbulb className="w-7 h-7" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-slate-400 mb-1">Saved Insights</div>
                        <div className="text-3xl font-bold text-white">{stats.insights}</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Datasets */}
                <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                            Recent Datasets
                        </h2>
                        <Link to="/datasets" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
                            View all <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="p-6 flex-1 flex flex-col gap-4">
                        {recentDatasets.length > 0 ? recentDatasets.map(ds => (
                            <Link key={ds.id} to={`/datasets/${ds.id}/analyze`} className="group flex items-center justify-between p-4 rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-slate-700/50 hover:border-indigo-500/30 transition-all">
                                <div>
                                    <h3 className="font-medium text-slate-200 group-hover:text-white mb-1">{ds.display_name}</h3>
                                    <div className="text-xs text-slate-500 flex items-center gap-3">
                                        <span>{ds.row_count.toLocaleString()} rows</span>
                                        <span>{ds.column_count} cols</span>
                                    </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                            </Link>
                        )) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm">
                                <p className="mb-4">No datasets uploaded yet.</p>
                                <Link to="/datasets" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                                    Upload CSV
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Analyses */}
                <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-emerald-400" />
                            Recent Analyses
                        </h2>
                    </div>
                    <div className="p-6 flex-1 flex flex-col gap-4">
                        {recentSessions.length > 0 ? recentSessions.map(session => (
                            <div key={session.id} className="p-4 rounded-xl border border-slate-700 bg-slate-900/50 flex flex-col gap-2">
                                <h3 className="font-medium text-slate-200 truncate" title={session.title}>"{session.title}"</h3>
                                <div className="text-xs text-slate-500 flex items-center justify-between">
                                    <span>{new Date(session.created_at).toLocaleDateString()}</span>
                                    <Link to={`/datasets/${session.dataset_id}/analyze?session=${session.id}`} className="text-emerald-400 hover:text-emerald-300 font-medium">
                                        Continue
                                    </Link>
                                </div>
                            </div>
                        )) : (
                            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                                No analyses found. Start one from a dataset.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
