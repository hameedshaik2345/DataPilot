import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BarChart3, Database, LayoutDashboard, LogOut, Lightbulb, Menu, X } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <nav className="bg-slate-800 border-b border-slate-700 p-4 relative z-50">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center gap-8">
                    <Link to="/dashboard" className="flex items-center gap-2 text-indigo-400 font-bold text-xl tracking-tight">
                        <BarChart3 className="w-6 h-6" />
                        <span className="hidden sm:inline">DataPilot AI</span>
                    </Link>
                    
                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-6 text-sm font-medium">
                        <Link to="/dashboard" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                            <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </Link>
                        <Link to="/datasets" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                            <Database className="w-4 h-4" /> Datasets
                        </Link>
                        <Link to="/insights" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                            <Lightbulb className="w-4 h-4" /> Saved Insights
                        </Link>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* User Info & Logout (Desktop) */}
                    <div className="hidden md:flex items-center gap-4">
                        <div className="text-sm text-slate-400">
                            Welcome, <span className="text-slate-200 font-medium">{user.name}</span>
                        </div>
                        <button 
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors bg-slate-700/50 hover:bg-slate-700 px-3 py-1.5 rounded-md"
                        >
                            <LogOut className="w-4 h-4" /> Logout
                        </button>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button 
                        className="md:hidden p-2 text-slate-300 hover:text-white transition-colors"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Dropdown Menu */}
            {isMobileMenuOpen && (
                <div className="absolute top-full left-0 right-0 bg-slate-800 border-b border-slate-700 shadow-xl md:hidden">
                    <div className="flex flex-col p-4 gap-4">
                        <div className="text-sm text-slate-400 border-b border-slate-700 pb-2">
                            Welcome, <span className="text-slate-200 font-medium">{user.name}</span>
                        </div>
                        <Link 
                            to="/dashboard" 
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors py-2"
                        >
                            <LayoutDashboard className="w-5 h-5" /> Dashboard
                        </Link>
                        <Link 
                            to="/datasets" 
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors py-2"
                        >
                            <Database className="w-5 h-5" /> Datasets
                        </Link>
                        <Link 
                            to="/insights" 
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors py-2"
                        >
                            <Lightbulb className="w-5 h-5" /> Saved Insights
                        </Link>
                        <button 
                            onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                            className="flex items-center gap-3 text-red-400 hover:text-red-300 transition-colors py-2 border-t border-slate-700 mt-2 pt-4"
                        >
                            <LogOut className="w-5 h-5" /> Logout
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
