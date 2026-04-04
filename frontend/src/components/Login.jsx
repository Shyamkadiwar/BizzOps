import React, { useState } from "react";
import axios from "axios";
import logo from '../assets/logo.png';
import { Mail, Lock, Eye, EyeOff, CheckCircle, ChevronRight } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "./Context/AuthContext";

function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorPopup, setErrorPopup] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    async function handleLogin(e) {
        e.preventDefault();
        setIsLoading(true);
        const data = { email, password };

        try {
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/login`, data, {
                withCredentials: true
            });

            if (response.status === 200) {
                const { accessToken, sessionId } = response.data.data;

                if (accessToken) {
                    localStorage.setItem("accessToken", accessToken);
                }
                if (sessionId) {
                    localStorage.setItem("sessionId", sessionId);
                    console.log("Session ID stored:", sessionId);
                }
                const isSuccess = true;

                if (isSuccess) {
                    login();
                    navigate('/dashboard');
                }
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            if (errorMessage === 'Request failed with status code 401') {
                setErrorPopup('Invalid Email Or Password');
            } else {
                setErrorPopup(errorMessage);
            }

            setTimeout(() => {
                setErrorPopup("");
            }, 3000);
            console.error("Error during login:", error.response?.data || error.message);
        } finally {
            setIsLoading(false);
        }
    }

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="min-h-screen bg-[#F5F5FA] flex items-center justify-center p-4 relative overflow-hidden font-poppins">
            {/* Ambient Backgrounds */}
            <div className="absolute top-[-10vw] left-[-10vw] w-[40vw] h-[40vw] bg-indigo-300 rounded-full mix-blend-multiply filter blur-[150px] opacity-40 pointer-events-none"></div>
            <div className="absolute bottom-[-10vw] right-[-10vw] w-[40vw] h-[40vw] bg-purple-300 rounded-full mix-blend-multiply filter blur-[150px] opacity-40 pointer-events-none"></div>

            <div className="w-full max-w-6xl z-10 flex flex-col md:flex-row gap-10 lg:gap-20 items-center">
                
                {/* Left Side: Branding */}
                <div className="w-full md:w-[40%] text-center md:text-left px-6">
                    <img src={logo} alt="BizzOps Logo" className="w-40 xl:w-48 mb-10 mx-auto md:mx-0 cursor-pointer" onClick={() => navigate('/')} />
                    <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
                        Log in to your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Smart Workspace</span>
                    </h1>
                    <p className="text-lg text-gray-500 mb-8 max-w-md mx-auto md:mx-0">
                        Streamline your operations and gain insights to make informed decisions. Welcome back!
                    </p>
                    
                    <ul className="space-y-4 text-gray-600 hidden md:block max-w-sm">
                        {[
                            "Ultimate Business Tool",
                            "Run and Scale Your CRM ERP Apps",
                            "Easily Add And Manage Your Services",
                            "Bring Together Invoices, Clients & Leads"
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 font-medium">
                                <CheckCircle size={20} className="text-indigo-500 flex-shrink-0" /> {item}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Right Side: Login Form */}
                <div className="w-full md:w-[60%] max-w-lg lg:max-w-xl">
                    <div className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2.5rem] p-10">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                        <p className="text-gray-500 mb-8">Please enter your details to sign in.</p>

                        <form onSubmit={handleLogin}>
                            <div className="relative mb-5">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="hello@company.com"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full py-4 pl-12 pr-4 bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all rounded-2xl text-gray-900 placeholder-gray-400 font-medium"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className="relative mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-semibold text-gray-700">Password</label>
                                    <button type="button" onClick={() => navigate('/forgot-password')} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">Forgot Password?</button>
                                </div>
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
                                        onClick={togglePasswordVisibility}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors"
                                        disabled={isLoading}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
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
                                {isLoading ? 'Signing In...' : <>Sign In <ChevronRight size={20} /></>}
                            </button>
                        </form>

                        <div className="mt-8 text-center" onClick={() => navigate('/register')}>
                            <p className="text-gray-500 text-sm font-medium">
                                Don't have an account? <span className="text-indigo-600 font-bold hover:underline cursor-pointer">Sign up free</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Toast */}
            {errorPopup && (
                <div className="fixed top-6 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-red-100 border border-red-300 text-red-800 px-6 py-4 rounded-full shadow-2xl z-50 animate-fade-in-up font-medium">
                    <Lock size={20} />
                    <span>{errorPopup}</span>
                </div>
            )}
        </div>
    );
}

export default Login;