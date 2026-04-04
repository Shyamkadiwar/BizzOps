import React, { useState } from "react";
import axios from "axios";
import logo from '../assets/logo.png';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate, useParams } from "react-router-dom";

function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState({ type: "", message: "" });

    async function handleSubmit(e) {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setStatus({ type: "error", message: "Passwords do not match." });
            return;
        }

        if (password.length < 6) {
            setStatus({ type: "error", message: "Password must be at least 6 characters long." });
            return;
        }

        setIsLoading(true);
        setStatus({ type: "", message: "" });

        try {
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/reset-password/${token}`, { password });
            setStatus({ type: "success", message: response.data.message || "Password successfully reset!" });
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Invalid or expired token.";
            setStatus({ type: "error", message: errorMessage });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#F5F5FA] flex items-center justify-center p-4 relative overflow-hidden font-poppins">
            {/* Ambient Backgrounds */}
            <div className="absolute top-[-10vw] left-[-10vw] w-[40vw] h-[40vw] bg-indigo-300 rounded-full mix-blend-multiply filter blur-[150px] opacity-40 pointer-events-none"></div>
            <div className="absolute bottom-[-10vw] right-[-10vw] w-[40vw] h-[40vw] bg-purple-300 rounded-full mix-blend-multiply filter blur-[150px] opacity-40 pointer-events-none"></div>

            <div className="w-full max-w-lg z-10 flex flex-col items-center">
                <img src={logo} alt="BizzOps Logo" className="w-40 xl:w-48 mb-8 cursor-pointer" onClick={() => navigate('/')} />

                <div className="w-full bg-white/80 backdrop-blur-xl border border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2.5rem] p-10">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Create New Password</h2>
                    <p className="text-gray-500 mb-8">Please enter your new password below.</p>

                    {status.message && (
                        <div className={`flex items-start gap-3 p-4 mb-6 rounded-2xl border ${status.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                            {status.type === 'success' ? <CheckCircle className="flex-shrink-0 mt-0.5" size={20} /> : <AlertCircle className="flex-shrink-0 mt-0.5" size={20} />}
                            <p className="text-sm font-medium">{status.message}</p>
                        </div>
                    )}

                    {!status.message || status.type === 'error' ? (
                        <form onSubmit={handleSubmit}>
                            <div className="relative mb-5">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full py-4 pl-12 pr-12 bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all rounded-2xl text-gray-900 placeholder-gray-400 font-medium"
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors"
                                        disabled={isLoading}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div className="relative mb-8">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full py-4 pl-12 pr-12 bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all rounded-2xl text-gray-900 placeholder-gray-400 font-medium"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full py-4 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_8px_20px_rgba(79,70,229,0.2)] ${
                                    isLoading
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                                        : 'bg-gray-900 text-white hover:bg-indigo-600 hover:-translate-y-0.5'
                                }`}
                            >
                                {isLoading ? 'Updating...' : <>Reset Password <RefreshCw size={18} /></>}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center mt-4">
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full py-4 bg-gray-900 hover:bg-indigo-600 shadow-[0_8px_20px_rgba(79,70,229,0.2)] hover:-translate-y-0.5 text-white font-bold rounded-2xl flex items-center justify-center transition-all"
                            >
                                Continue to Login
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ResetPassword;
