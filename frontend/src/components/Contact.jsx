import React, { useState } from "react";
import axios from "axios";
import logo from '../assets/logo.png';
import { Mail, User, CheckCircle, ChevronRight, MessageSquare, Tag, Info } from 'lucide-react';
import { useNavigate } from "react-router-dom";

function Contact() {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");

    const [errorPopup, setErrorPopup] = useState("");
    const [successPopup, setSuccessPopup] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleContact(e) {
        e.preventDefault();
        setIsLoading(true);
        const data = { name, email, subject, message };

        try {
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/contact`, data);

            if (response.status === 200) {
                setSuccessPopup("Message sent successfully. We will get back to you shortly!");
                setName("");
                setEmail("");
                setSubject("");
                setMessage("");

                setTimeout(() => {
                    setSuccessPopup("");
                }, 3000);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to send message";
            setErrorPopup(errorMessage);

            setTimeout(() => {
                setErrorPopup("");
            }, 3000);
            console.error("Error sending contact message:", errorMessage);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#F5F5FA] flex items-center justify-center p-4 relative overflow-hidden font-poppins py-12">
            {/* Ambient Backgrounds */}
            <div className="absolute top-[-10vw] left-[-10vw] w-[40vw] h-[40vw] bg-indigo-300 rounded-full mix-blend-multiply filter blur-[150px] opacity-40 pointer-events-none"></div>
            <div className="absolute bottom-[-10vw] right-[-10vw] w-[40vw] h-[40vw] bg-purple-300 rounded-full mix-blend-multiply filter blur-[150px] opacity-40 pointer-events-none"></div>

            <div className="w-full max-w-6xl z-10 flex flex-col md:flex-row gap-10 lg:gap-20 items-center">
                
                {/* Left Side: Branding and Info */}
                <div className="w-full md:w-[40%] text-center md:text-left px-6">
                    <img src={logo} alt="BizzOps Logo" className="w-40 xl:w-48 mb-10 mx-auto md:mx-0 cursor-pointer" onClick={() => navigate('/')} />
                    <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
                        We'd love to <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Hear from you</span>
                    </h1>
                    <p className="text-lg text-gray-500 mb-8 max-w-md mx-auto md:mx-0 font-medium">
                        Whether you have a question about features, trials, pricing, need a demo, or anything else, our team is ready to answer all your questions.
                    </p>
                    
                    <ul className="space-y-4 text-gray-600 hidden md:block max-w-sm">
                        <li className="flex items-center gap-3 font-medium">
                            <CheckCircle size={20} className="text-indigo-500 flex-shrink-0" /> Enterprise-grade support
                        </li>
                        <li className="flex items-center gap-3 font-medium">
                            <CheckCircle size={20} className="text-indigo-500 flex-shrink-0" /> Fast response times
                        </li>
                        <li className="flex items-center gap-3 font-medium">
                            <CheckCircle size={20} className="text-indigo-500 flex-shrink-0" /> Dedicated account managers
                        </li>
                    </ul>
                </div>

                {/* Right Side: Contact Form */}
                <div className="w-full md:w-[60%] max-w-lg lg:max-w-xl">
                    <div className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2.5rem] p-6 sm:p-10">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Get in Touch</h2>
                        <p className="text-gray-500 mb-8 font-medium">Fill out the form and we'll be in touch shortly.</p>

                        <form onSubmit={handleContact}>
                            
                            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                {/* Name */}
                                <div className="w-full sm:w-1/2 relative">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="John Doe"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full py-3 pl-11 pr-4 bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all rounded-2xl text-gray-900 placeholder-gray-400 font-medium"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="w-full sm:w-1/2 relative">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="email"
                                            placeholder="hello@company.com"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full py-3 pl-11 pr-4 bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all rounded-2xl text-gray-900 placeholder-gray-400 font-medium"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Subject */}
                            <div className="relative mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                                <div className="relative">
                                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="How can we help?"
                                        required
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className="w-full py-3 pl-11 pr-4 bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all rounded-2xl text-gray-900 placeholder-gray-400 font-medium"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            {/* Message */}
                            <div className="relative mb-8">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                                <div className="relative">
                                    <MessageSquare className="absolute left-4 top-5 text-gray-400" size={18} />
                                    <textarea
                                        rows="4"
                                        placeholder="Tell us more about your inquiry..."
                                        required
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="w-full py-4 pl-11 pr-4 bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all rounded-2xl text-gray-900 placeholder-gray-400 font-medium resize-none"
                                        disabled={isLoading}
                                    ></textarea>
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
                                {isLoading ? 'Sending...' : <>Send Message <ChevronRight size={20} /></>}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Error Toast */}
            {errorPopup && (
                <div className="fixed top-6 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-red-100 border border-red-300 text-red-800 px-6 py-4 rounded-full shadow-2xl z-50 animate-fade-in-up font-medium">
                    <Info size={20} />
                    <span>{errorPopup}</span>
                </div>
            )}
            
            {/* Success Toast */}
            {successPopup && (
                <div className="fixed top-6 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-green-100 border border-green-300 text-green-800 px-6 py-4 rounded-full shadow-2xl z-50 animate-fade-in-up font-medium">
                    <CheckCircle size={20} />
                    <span>{successPopup}</span>
                </div>
            )}
        </div>
    );
}

export default Contact;
