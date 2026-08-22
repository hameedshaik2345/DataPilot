import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { UploadCloud, Trash2, Edit2, Play, FileSpreadsheet, FileText, Check, X } from 'lucide-react';

const Datasets = () => {
    const [datasets, setDatasets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchDatasets = async () => {
        try {
            const res = await api.get('/datasets');
            setDatasets(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDatasets();
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        
        const file = e.target.files[0];
        if (!file.name.endsWith('.csv')) {
            alert('Only CSV files are allowed');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        
        setUploading(true);
        try {
            await api.post('/datasets/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchDatasets();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Upload failed');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this dataset?')) return;
        try {
            await api.delete(`/datasets/${id}`);
            setDatasets(datasets.filter(d => d.id !== id));
        } catch (err) {
            alert('Failed to delete');
        }
    };

    const startEdit = (id: string, currentName: string) => {
        setEditingId(id);
        setEditName(currentName);
    };

    const saveEdit = async (id: string) => {
        try {
            const res = await api.patch(`/datasets/${id}`, { display_name: editName });
            setDatasets(datasets.map(d => d.id === id ? { ...d, display_name: res.data.display_name } : d));
            setEditingId(null);
        } catch (err) {
            alert('Failed to rename');
        }
    };

    if (loading) return <div className="p-8 text-slate-400">Loading...</div>;

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">My Datasets</h1>
                    <p className="text-sm md:text-base text-slate-400">Manage and analyze your uploaded CSV files.</p>
                </div>
                
                <input 
                    type="file" 
                    accept=".csv" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                >
                    <UploadCloud className="w-5 h-5" />
                    {uploading ? 'Uploading...' : 'Upload CSV'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {datasets.map(ds => (
                    <div key={ds.id} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden flex flex-col group hover:border-slate-600 transition-colors shadow-sm">
                        <div className="p-5 border-b border-slate-700/50 bg-slate-800/80">
                            <div className="flex items-start justify-between mb-2">
                                <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400 shrink-0">
                                    <FileSpreadsheet className="w-5 h-5" />
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => startEdit(ds.id, ds.display_name)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(ds.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            
                            {editingId === ds.id ? (
                                <div className="flex items-center gap-2 mt-2">
                                    <input 
                                        type="text" 
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                                        autoFocus
                                    />
                                    <button onClick={() => saveEdit(ds.id)} className="text-green-400 hover:bg-green-500/20 p-1 rounded"><Check className="w-4 h-4"/></button>
                                    <button onClick={() => setEditingId(null)} className="text-slate-400 hover:bg-slate-700 p-1 rounded"><X className="w-4 h-4"/></button>
                                </div>
                            ) : (
                                <h3 className="font-semibold text-lg text-slate-200 truncate mt-2" title={ds.display_name}>{ds.display_name}</h3>
                            )}
                            <div className="text-xs text-slate-500 mt-1 truncate" title={ds.filename}>{ds.filename}</div>
                        </div>
                        
                        <div className="p-5 flex-1 flex flex-col gap-4">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <div className="text-xs text-slate-500 mb-1">Rows</div>
                                    <div className="font-medium text-slate-300">{ds.row_count.toLocaleString()}</div>
                                </div>
                                <div className="flex-1">
                                    <div className="text-xs text-slate-500 mb-1">Columns</div>
                                    <div className="font-medium text-slate-300">{ds.column_count}</div>
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 mb-1">Uploaded</div>
                                <div className="text-sm text-slate-400">{new Date(ds.created_at).toLocaleDateString()}</div>
                            </div>
                        </div>
                        
                        <div className="p-4 bg-slate-900/50 border-t border-slate-700/50">
                            <Link 
                                to={`/datasets/${ds.id}/analyze`}
                                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-colors font-medium text-sm"
                            >
                                <Play className="w-4 h-4" /> Start Analysis
                            </Link>
                        </div>
                    </div>
                ))}

                {datasets.length === 0 && !loading && (
                    <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-700 rounded-2xl">
                        <FileText className="w-12 h-12 mb-4 text-slate-600" />
                        <p className="text-lg font-medium mb-2">No datasets found</p>
                        <p className="text-sm text-slate-500 mb-6">Upload a CSV file to get started.</p>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-6 rounded-lg transition-all"
                        >
                            Upload CSV
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Datasets;
