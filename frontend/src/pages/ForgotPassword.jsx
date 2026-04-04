import React, { useState } from "react";
import axios from "axios";
import logo from '../assets/logo.png';
import { Mail, ArrowLeft, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from "react-router-dom";

function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState({ type: "", message: "" });

    async function handleReset(e) {
        e.preventDefault();
        setIsLoading(true);
        setStatus({ type: "", message: "" });

        try {
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/forgot-password`, { email });
            setStatus({ type: "success", message: response.data.message || "Password reset link sent!" });
        } catch (error) {
            const errorMessage = error.response?.data?.message || "There was an error processing your request.";
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
                    <button 
                        onClick={() => navigate('/login')}
                        className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-indigo-600 mb-6 transition-colors"
                    >
                        <ArrowLeft size={16} /> Back to Login
                    </button>

                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h2>
                    <p className="text-gray-500 mb-8">Enter your email address and we'll send you a link to reset your password.</p>

                    {status.message && (
                        <div className={`flex items-start gap-3 p-4 mb-6 rounded-2xl border ${status.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                            {status.type === 'success' ? <CheckCircle className="flex-shrink-0 mt-0.5" size={20} /> : <AlertCircle className="flex-shrink-0 mt-0.5" size={20} />}
                            <p className="text-sm font-medium">{status.message}</p>
                        </div>
                    )}

                    {!status.message || status.type === 'error' ? (
                        <form onSubmit={handleReset}>
                            <div className="relative mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="email"
                                        placeholder="hello@company.com"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full py-4 pl-12 pr-4 bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all rounded-2xl text-gray-900 placeholder-gray-400 font-medium"
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
                                {isLoading ? 'Sending...' : <>Send Reset Link <Send size={18} /></>}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center mt-4">
                            <p className="text-sm text-gray-600 mb-6">
                                Please check your email inbox and spam folder.
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-2xl flex items-center justify-center transition-all"
                            >
                                Return to Login
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;
