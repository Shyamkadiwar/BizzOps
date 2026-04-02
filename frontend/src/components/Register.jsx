import React, { useState } from 'react';
import axios from 'axios';
import { User, Mail, Briefcase, Phone, MapPin, Lock, Eye, EyeOff, CheckCircle, ChevronRight } from 'lucide-react';
import logo from '../assets/logo.png'; 
import { useNavigate } from 'react-router-dom';

function Register() {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [businessName, setBusinessName] = useState("");
    const [password, setPassword] = useState("");
    const [phoneNo, setPhoneNo] = useState("");
    const [address, setAddress] = useState("");
    const [showPopup, setShowPopup] = useState(false);
    const [errorPopup, setErrorPopup] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    async function handleRegister(e) {
        e.preventDefault();
        setIsLoading(true);
        const data = { name, email, businessName, password, phoneNo, address };

        try {
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/register`, data, {
                withCredentials: true,
            });

            if (response.status === 201) {
                setShowPopup(true);

                setTimeout(() => {
                    setShowPopup(false);
                    navigate('/login');
                }, 2000);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            if (errorMessage === 'Request failed with status code 409') {
                setErrorPopup('User Already Exists');
            } else {
                setErrorPopup(errorMessage);
            }

            setTimeout(() => {
                setErrorPopup("");
            }, 3000);
            console.error("Error during registration:", errorMessage);
        } finally {
            setIsLoading(false);
        }
    }

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="min-h-screen bg-[#F5F5FA] flex items-center justify-center p-4 relative overflow-hidden font-poppins py-12">
            {/* Ambient Backgrounds */}
            
            <div className="absolute top-[-10vw] right-[-10vw] w-[40vw] h-[40vw] bg-indigo-300 rounded-full mix-blend-multiply filter blur-[150px] opacity-40 pointer-events-none"></div>
            <div className="absolute bottom-[-10vw] left-[-10vw] w-[40vw] h-[40vw] bg-purple-300 rounded-full mix-blend-multiply filter blur-[150px] opacity-40 pointer-events-none"></div>

            <div className="w-full max-w-6xl z-10 flex flex-col md:flex-row-reverse gap-10 lg:gap-20 items-center">
                
                {/* Right Side (visually): Branding */}
                <div className="w-full md:w-[40%] text-center md:text-left px-6">
                    <img src={logo} alt="BizzOps Logo" className="w-40 xl:w-48 mb-10 mx-auto md:mx-0 cursor-pointer" onClick={() => navigate('/')} />
                    <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
                        Start optimizing <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Your Business Today</span>
                    </h1>
                    <p className="text-lg text-gray-500 mb-8 max-w-md mx-auto md:mx-0">
                        Join thousands of companies using BizzOps to streamline their operations, automate invoices, and grow revenue.
                    </p>
                    
                    <ul className="space-y-4 text-gray-600 hidden md:block max-w-sm">
                        {[
                            "Ultimate Business Intelligence Tool",
                            "AI-Powered Real-Time Insights",
                            "Manage Employees and Contacts",
                            "Track Invoices, Vendors & Leads smoothly"
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 font-medium">
                                <CheckCircle size={20} className="text-emerald-500 flex-shrink-0" /> {item}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Left Side (visually): Register Form */}
                <div className="w-full md:w-[60%] max-w-xl lg:max-w-2xl">
                    <div className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2rem] p-6 sm:p-8">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Create Account</h2>
                        <p className="text-gray-500 mb-6 text-sm">Sign up for your 14-day free trial.</p>

                        <form onSubmit={handleRegister}>
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-3 sm:mb-4">
                                {/* Full Name */}
                                <div className="w-full sm:w-1/2">
                                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="John Doe"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full py-2.5 pl-9 pr-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all rounded-[1rem] text-gray-900 placeholder-gray-400 font-medium text-sm"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="w-full sm:w-1/2">
                                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="email"
                                            placeholder="hello@company.com"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full py-2.5 pl-9 pr-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all rounded-[1rem] text-gray-900 placeholder-gray-400 font-medium text-sm"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-3 sm:mb-4">
                                {/* Business Name */}
                                <div className="w-full sm:w-1/2">
                                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">Business Name</label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Acme Corp"
                                            required
                                            value={businessName}
                                            onChange={(e) => setBusinessName(e.target.value)}
                                            className="w-full py-2.5 pl-9 pr-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all rounded-[1rem] text-gray-900 placeholder-gray-400 font-medium text-sm"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                {/* Phone No */}
                                <div className="w-full sm:w-1/2">
                                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="tel"
                                            placeholder="+1 234 567 89"
                                            required
                                            value={phoneNo}
                                            onChange={(e) => setPhoneNo(e.target.value)}
                                            className="w-full py-2.5 pl-9 pr-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all rounded-[1rem] text-gray-900 placeholder-gray-400 font-medium text-sm"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Address */}
                            <div className="relative mb-3 sm:mb-4">
                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">Address</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="123 Corporate Blvd, City"
                                        required
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        className="w-full py-2.5 pl-9 pr-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all rounded-[1rem] text-gray-900 placeholder-gray-400 font-medium text-sm"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="relative mb-6">
                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full py-2.5 pl-9 pr-10 bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all rounded-[1rem] text-gray-900 placeholder-gray-400 font-medium text-sm"
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors"
                                        disabled={isLoading}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full py-3.5 font-bold text-sm rounded-[1rem] flex items-center justify-center gap-2 transition-all shadow-[0_8px_20px_rgba(79,70,229,0.2)] ${
                                    isLoading
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                                        : 'bg-gray-900 text-white hover:bg-indigo-600 hover:-translate-y-0.5'
                                }`}
                            >
                                {isLoading ? 'Creating Account...' : <>Sign Up Free <ChevronRight size={18} /></>}
                            </button>
                        </form>

                        <div className="mt-8 text-center" onClick={() => navigate('/login')}>
                            <p className="text-gray-500 text-sm font-medium">
                                Already have an account? <span className="text-indigo-600 font-bold hover:underline cursor-pointer">Sign in</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Toast */}
            {showPopup && (
                <div className="fixed top-6 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-green-100 border border-green-300 text-green-800 px-6 py-4 rounded-full shadow-2xl z-50 animate-fade-in-up font-medium">
                    <CheckCircle size={20} />
                    <span>Registration Successful! Redirecting...</span>
                </div>
            )}

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

export default Register;