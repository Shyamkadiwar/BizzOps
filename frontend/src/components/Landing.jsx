import React, { useEffect } from "react";
import one from '../assets/one.png';
import dashborad1 from '../assets/dashborad1.png'
import dashborad2 from '../assets/dashborad2.png'
import {
    Bot, Activity, FileText, Table, Shield, LayoutGrid, ChevronRight, Play,
    ShoppingCart, Package, Users, Briefcase, Tag, ClipboardList, PieChart,
    CheckCircle, Calendar, Wallet, Gem, Mail, LineChart, CreditCard,
    Twitter, Linkedin, Github
} from 'lucide-react';
import logo from '../assets/logo.png';
import { useNavigate } from "react-router-dom";
import DummyDashboard from './DummyDashboard';

function Landing() {
    const navigate = useNavigate();

    // Smooth scroll handler
    const scrollToSection = (e, sectionId) => {
        e.preventDefault();
        const element = document.getElementById(sectionId);
        if (element) {
            const offset = 80;
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F5FA] overflow-x-hidden relative font-poppins text-gray-900 pb-10 scroll-smooth">
            <style>
                {`
                html {
                    scroll-behavior: smooth;
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    opacity: 0;
                    animation: fadeInUp 0.8s ease-out forwards;
                }
                .delay-100 { animation-delay: 100ms; }
                .delay-200 { animation-delay: 200ms; }
                .delay-300 { animation-delay: 300ms; }
                .delay-400 { animation-delay: 400ms; }
                
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-15px); }
                    100% { transform: translateY(0px); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                
                .glass-nav {
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(229, 231, 235, 0.8);
                }

                .glass-card {
                    background: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 1);
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03);
                }

                /* Modern gradient text utility */
                .text-gradient {
                    background: linear-gradient(135deg, #4f46e5 0%, #aa69e7ff 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                `}
            </style>

            {/* Deep Ambient Glows for Modern Look */}
            <div className="absolute top-0 left-[-10vw] w-[40vw] h-[40vw] bg-indigo-300 rounded-full mix-blend-multiply filter blur-[180px] opacity-40 pointer-events-none"></div>
            <div className="absolute top-[20%] right-[-10vw] w-[40vw] h-[40vw] bg-fuchsia-300 rounded-full mix-blend-multiply filter blur-[180px] opacity-30 pointer-events-none"></div>
            <div className="absolute bottom-[20%] left-[20vw] w-[50vw] h-[50vw] bg-cyan-200 rounded-full mix-blend-multiply filter blur-[200px] opacity-20 pointer-events-none"></div>

            {/* Floating Island Navbar */}
            <nav className="fixed z-50 glass-nav top-6 left-1/2 -translate-x-1/2 py-2 px-4 md:px-6 rounded-full w-[95%] max-w-4xl flex justify-between items-center transition-all duration-300 shadow-md">
                <div className="flex items-center cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
                    <img className="h-6 md:h-7 object-contain" src={logo} alt="BizzOps Logo" />
                </div>

                <div className="hidden md:flex gap-6 lg:gap-8 items-center text-sm font-semibold text-gray-600">
                    <a href="#home" onClick={(e) => scrollToSection(e, 'home')} className="hover:text-indigo-600 transition-colors">Home</a>
                    <a href="#core-usps" onClick={(e) => scrollToSection(e, 'core-usps')} className="hover:text-indigo-600 transition-colors">Platform</a>
                    <a href="#modules" onClick={(e) => scrollToSection(e, 'modules')} className="hover:text-indigo-600 transition-colors">Modules</a>
                    <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} className="hover:text-indigo-600 transition-colors">Pricing</a>
                </div>

                <div className="flex gap-3 items-center">
                    <button onClick={() => navigate('/login')} className="text-sm font-bold text-gray-700 hover:text-black transition-colors hidden sm:block px-2">
                        Log In
                    </button>
                    <button onClick={() => navigate('/register')} className="bg-gray-900 text-white text-xs sm:text-sm font-semibold px-5 py-2 rounded-full hover:bg-indigo-600 transition-all hover:shadow-[0_8px_20px_rgba(79,70,229,0.3)] hover:-translate-y-0.5">
                        Start Free
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <div id="home" className="pt-40 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center relative z-10">
                <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-white border border-indigo-100 shadow-sm text-indigo-700 text-xs sm:text-sm font-bold tracking-wide animate-fade-in-up">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    AI-Powered SME Operating System
                </div>
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-6 animate-fade-in-up delay-100 leading-[1.1]">
                    Manage Your Business <br className="hidden md:block" />
                    <span className="text-gradient">Smarter and Faster</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-3xl mx-auto animate-fade-in-up delay-200 font-medium">
                    BizzOps consolidates 12+ critical business functions from sales tracking to AI-driven insights into a single, unified platform tailored for SMEs.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up delay-300">
                    <button onClick={() => navigate('/register')} className="bg-gray-900 text-white font-semibold px-8 py-4 rounded-full hover:bg-indigo-600 transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2">
                        Get 14 Days Free Trial <ChevronRight size={18} />
                    </button>
                    <button onClick={() => navigate('/Demo')} className="bg-white border border-gray-200 text-gray-800 font-semibold px-8 py-4 rounded-full hover:bg-gray-50 transition-all hover:-translate-y-1 shadow-sm flex items-center justify-center gap-2">
                        <Play size={18} className="text-indigo-600 fill-indigo-600" /> Watch Demo
                    </button>
                </div>
            </div>

            {/* Dashboard Showcase (Bento Hero Style) */}
            <div className="max-w-[92%] 2xl:max-w-[1400px] mx-auto px-4 relative z-10 animate-fade-in-up delay-400 mb-32 mt-4">
                <div className="rounded-[2.5rem] p-3 bg-white/50 backdrop-blur-xl border border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
                    <div className="bg-gray-50 rounded-[2rem] overflow-hidden border border-gray-200 shadow-inner relative group">
                        {/* Fake Browser header */}
                        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white relative z-20">
                            <div className="flex gap-2">
                                <div className="w-3.5 h-3.5 rounded-full bg-red-400"></div>
                                <div className="w-3.5 h-3.5 rounded-full bg-amber-400"></div>
                                <div className="w-3.5 h-3.5 rounded-full bg-green-400"></div>
                            </div>
                            <div className="bg-gray-100 flex-1 mx-6 rounded-lg text-xs font-mono text-gray-500 py-2 text-center max-w-md hidden sm:block">
                                bizzops.shyamkadiwar.site/dashboard
                            </div>
                            <div className="w-16"></div>
                        </div>

                        {/* Interactive Dashboard Container */}
                        <div className="w-full relative bg-gray-50 rounded-b-[2rem] overflow-hidden">
                            {/* Overlay to hint interactivity when not hovered */}
                            <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] z-10 flex items-center justify-center opacity-100 transition-opacity duration-300 group-hover:opacity-0 group-hover:pointer-events-none">
                                <div className="bg-gray-900/80 text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 shadow-xl border border-gray-700/50">
                                    <span className="relative flex h-3 w-3 mr-1">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                    </span>
                                    Hover & Scroll to Explore
                                </div>
                            </div>

                            {/* The Dummy Dashboard */}
                            <DummyDashboard />
                        </div>
                    </div>
                </div>
            </div>

            {/* Core USPs Section (Bento Grid) */}
            <div id="core-usps" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-10 pb-20">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-indigo-600 font-bold mb-3 uppercase tracking-widest text-xs">The BizzOps Difference</h2>
                    <h3 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">Built for scale. <br /> Engineered for simplicity.</h3>
                    <p className="text-gray-500 text-lg">Replace disjointed tools like Tally, WhatsApp, and spreadsheets with a cohesive, AI driven engine.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                    {/* Big Bento Card 1 */}
                    <div className="md:col-span-4 glass-card p-8 md:p-10 rounded-[2rem] hover:-translate-y-1 transition-transform group">
                        <div className="w-14 h-14 bg-indigo-50 rounded-[1.2rem] flex items-center justify-center mb-6 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                            <Bot size={28} className="text-indigo-600 group-hover:text-white" />
                        </div>
                        <h4 className="text-2xl font-bold text-gray-900 mb-3">Agentic AI Intelligence</h4>
                        <p className="text-gray-500 text-lg leading-relaxed max-w-xl">
                            Our LangChain powered AI doesn't just chat. It analyzes your inventory, flags low stock, generated smart insights, and uses Gemini Pro to process scanned invoices directly into your database.
                        </p>
                    </div>

                    {/* Small Bento 1 */}
                    <div className="md:col-span-2 glass-card p-8 md:p-10 rounded-[2rem] hover:-translate-y-1 transition-transform group bg-gradient-to-br from-white to-purple-50/50">
                        <div className="w-14 h-14 bg-white rounded-[1.2rem] flex items-center justify-center mb-6 shadow-sm border border-purple-100 group-hover:scale-110 transition-transform">
                            <Activity size={28} className="text-purple-600" />
                        </div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">Business Health Score</h4>
                        <p className="text-gray-500 leading-relaxed">
                            A single 0-100 metric calculated live from revenue, stock, cash flow, and retention.
                        </p>
                    </div>

                    {/* Small Bento 2 */}
                    <div className="md:col-span-2 glass-card p-8 md:p-10 rounded-[2rem] hover:-translate-y-1 transition-transform group flex flex-col justify-between">
                        <div>
                            <div className="w-14 h-14 bg-rose-50 rounded-[1.2rem] flex items-center justify-center mb-6 border border-rose-100 group-hover:bg-rose-500 transition-colors">
                                <Briefcase size={28} className="text-rose-600 group-hover:text-white" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-2">Inventory, Vendor & Product</h4>
                            <p className="text-gray-500 leading-relaxed">
                                Complete workflow linkage. Manage the entire balance history and interactions of vendors in one place.
                            </p>
                        </div>
                    </div>

                    {/* Big Bento Card 2 */}
                    <div className="md:col-span-4 glass-card p-8 md:p-10 rounded-[2rem] hover:-translate-y-1 transition-transform group relative overflow-hidden">
                        <div className="w-14 h-14 bg-emerald-50 rounded-[1.2rem] flex items-center justify-center mb-6 border border-emerald-100 z-10 relative group-hover:bg-emerald-500 transition-colors">
                            <ShoppingCart size={28} className="text-emerald-600 group-hover:text-white" />
                        </div>
                        <h4 className="text-2xl font-bold text-gray-900 mb-3 z-10 relative">Sales, Customer & Invoice Workflow</h4>
                        <p className="text-gray-500 text-lg leading-relaxed max-w-xl z-10 relative">
                            A seamless loop. Executing a sale automatically creates an invoice and updates the customer's balance history instantly without manual entry.
                        </p>
                        {/* Decorative background shape */}
                        <div className="absolute right-[-5%] bottom-[-20%] w-64 h-64 bg-emerald-100 rounded-full mix-blend-multiply opacity-50 filter blur-[60px]"></div>
                    </div>
                </div>
            </div>

            {/* Comprehensive 12+ Modules Grid */}
            <div id="modules" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-24 pb-20">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-indigo-600 font-bold mb-3 uppercase tracking-widest text-xs">Complete Arsenal</h2>
                    <h3 className="text-4xl font-extrabold text-gray-900 mb-6">12+ Modules. One Platform.</h3>
                    <p className="text-gray-500 text-lg">Every function you need to manage your business effectively, integrated flawlessly.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {/* Module Items */}
                    {[
                        // Row 1
                        { icon: ShoppingCart, name: "Sales Management", desc: "Execute multi-item sales, track individual product margins, and automatically deduct from inventory in real time." },
                        { icon: Package, name: "Inventory Management", desc: "Gain complete control with smart stock aggregation, value tracking, and AI powered low stock predictions." },
                        { icon: FileText, name: "Auto-Invoicing", desc: "Instantly generate professional, business branded PDF invoices with auto calculated per-item taxes on every sale." },
                        { icon: Users, name: "CRM", desc: "Centralize your customer data. Track lifetime value, retention rates, and automatically update individual balances." },
                        // Row 2 (New modules)
                        { icon: LayoutGrid, name: "Dashboard", desc: "Get a comprehensive 0-100 Business Health Score with real time KPI metrics, revenue charts, and live sparklines." },
                        { icon: LineChart, name: "Financial Reports", desc: "Analyze your financial health with deep dive reports comparing revenue against expenses and overall margins." },
                        { icon: Mail, name: "Email Service", desc: "Effortlessly dispatch automated purchase orders to vendors and payment request links seamlessly to your customers." },
                        { icon: CreditCard, name: "Payment Tracking", desc: "Automatically match customer payments received via requested emails to immediately clear pending invoices." },
                        // Row 3
                        { icon: Wallet, name: "Expense Tracking", desc: "Log all overheads securely. Use advanced categorization and Excel bulk imports to manage cash flow flawlessly." },
                        { icon: Briefcase, name: "Vendor Hub", desc: "Maintain all supplier contacts, track bulk purchase histories, monitor ratings, and analyze average payment times." },
                        { icon: Tag, name: "Product Catalog", desc: "Showcase your entire offering with categories, best-seller analytics, and automated margin calculations." },
                        { icon: ClipboardList, name: "Order Fulfillment", desc: "Manage operational orders with absolute precision. Track pending vs fulfilled metrics and average completion times." },
                        // Row 4
                        { icon: PieChart, name: "Deals Pipeline", desc: "A visual Kanban style CRM. Push deals through custom stages, track conversion rates, and forecast pipeline value." },
                        { icon: CheckCircle, name: "Task Management", desc: "Enforce accountability. Assign specific tasks to your staff, set priority deadlines, and monitor completion metrics." },
                        { icon: Calendar, name: "Appointments", desc: "An interactive, drag-and-drop scheduling calendar directly linked to customer profiles for frictionless booking." },
                        { icon: Shield, name: "Staff Tracking", desc: "Manage your workforce effectively. View active staff profiles, role privileges, and detailed productivity scoring." },
                    ].map((mod, i) => (
                        <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group flex flex-col h-full cursor-pointer">
                            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                <mod.icon size={22} className="text-indigo-600" />
                            </div>
                            <h4 className="font-bold text-gray-900 mb-2 text-lg">{mod.name}</h4>
                            <p className="text-sm text-gray-500 leading-relaxed">{mod.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pricing Section */}
            <div id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-24 pb-20">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-indigo-600 font-bold mb-3 uppercase tracking-widest text-xs">Affordable Scale</h2>
                    <h3 className="text-4xl font-extrabold text-gray-900 mb-6">Simple, transparent pricing</h3>
                    <p className="text-gray-500 text-lg">Stop paying per-module. Get the entire suite at one SME friendly price.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* Starter Tier */}
                    <div className="bg-white rounded-[2rem] p-10 border border-gray-200 shadow-sm relative group hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
                        <h4 className="text-2xl font-bold text-gray-900 mb-2">14-Day Free Trial</h4>
                        <p className="text-gray-500 mb-6">Experience the full power of BizzOps with absolutely zero commitment.</p>
                        <div className="text-5xl font-extrabold text-gray-900 mb-8">₹0<span className="text-lg text-gray-400 font-medium">/for 14 days</span></div>
                        <ul className="space-y-4 mb-10">
                            {[
                                "Access to all 12+ Modules",
                                "AI-Powered Business Insights",
                                "Dashboard Analytics",
                                "1 Admin User"
                            ].map((feature, i) => (
                                <li key={i} className="flex items-center gap-3 text-gray-600 font-medium">
                                    <CheckCircle size={20} className="text-emerald-500 flex-shrink-0" /> {feature}
                                </li>
                            ))}
                        </ul>
                        <button onClick={() => navigate('/register')} className="w-full bg-gray-50 text-gray-900 font-bold py-4 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200">
                            Start Default Trial
                        </button>
                    </div>

                    {/* Pro Tier */}
                    <div className="bg-gray-900 rounded-[2rem] p-10 shadow-2xl relative overflow-hidden text-white border border-gray-800 transform md:-translate-y-4 group hover:-translate-y-6 hover:shadow-indigo-500/20 hover:shadow-2xl transition-all duration-300">
                        {/* Glow effect */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500 rounded-full mix-blend-screen filter blur-[80px] opacity-40"></div>

                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold mb-6">
                            <Gem size={14} /> RECOMMENDED
                        </div>
                        <h4 className="text-2xl font-bold text-white mb-2">BizzOps Pro</h4>
                        <p className="text-gray-400 mb-6">The ultimate operating system for growing your business.</p>
                        <div className="text-5xl font-extrabold text-white mb-8">₹499<span className="text-lg text-gray-400 font-medium">/month</span></div>
                        <ul className="space-y-4 mb-10">
                            {[
                                "Everything in Free Trial",
                                "Unlimited Invoices & Receipts",
                                "Advanced LangChain AI Limits",
                                "Multi-Device Security Management",
                                "Priority Tech Support"
                            ].map((feature, i) => (
                                <li key={i} className="flex items-center gap-3 text-gray-300 font-medium">
                                    <CheckCircle size={20} className="text-indigo-400 flex-shrink-0" /> {feature}
                                </li>
                            ))}
                        </ul>
                        <button onClick={() => navigate('/register')} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-500 transition-colors shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                            Upgrade to Pro
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom CTA */}
            <div className="max-w-6xl mx-auto px-4 relative z-10 my-20">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] p-12 md:p-20 text-center shadow-2xl relative overflow-hidden border border-indigo-400/30">
                    <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-[60px] opacity-20"></div>

                    <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 relative z-10 tracking-tight">Stop stressing. <br /> Start growing.</h2>
                    <p className="text-indigo-100 max-w-2xl mx-auto mb-10 text-xl relative z-10 font-medium">Join thousand of business owners who abandoned their spreadsheets and scaled with BizzOps.</p>

                    <button onClick={() => navigate('/register')} className="bg-white text-indigo-700 font-bold px-10 py-5 rounded-full hover:scale-105 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.2)] relative z-10 text-lg">
                        Create Your Account Free
                    </button>
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-gray-200 mt-20 bg-white relative z-10 pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                        <div className="col-span-1 md:col-span-2">
                            <img src={logo} className="h-8 mb-6 opacity-80 object-contain" alt="Bizzops Logo" />
                            <p className="text-gray-500 max-w-sm mb-6 leading-relaxed">
                                The AI powered, all in one business operating system seamlessly replacing disjointed spreadsheets and fragmented tools for SMEs worldwide.
                            </p>
                            <div className="flex gap-4">
                                <a href="https://x.com/KadiwarShyam" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                                    <Twitter size={18} />
                                </a>
                                <a href="https://www.linkedin.com/in/shyamkadiwar" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                                    <Linkedin size={18} />
                                </a>
                                <a href="https://github.com/shyamkadiwar" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                                    <Github size={18} />
                                </a>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-900 mb-5">Platform</h4>
                            <ul className="space-y-4">
                                <li><a href="#core-usps" onClick={(e) => scrollToSection(e, 'core-usps')} className="text-gray-500 hover:text-indigo-600 transition-colors font-medium">Core USPs</a></li>
                                <li><a href="#modules" onClick={(e) => scrollToSection(e, 'modules')} className="text-gray-500 hover:text-indigo-600 transition-colors font-medium">All Modules</a></li>
                                <li><a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} className="text-gray-500 hover:text-indigo-600 transition-colors font-medium">Pricing</a></li>
                                <li><a href="#security" className="text-gray-500 hover:text-indigo-600 transition-colors font-medium">Security</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-900 mb-5">Company</h4>
                            <ul className="space-y-4">
                                <li><a href="#about" className="text-gray-500 hover:text-indigo-600 transition-colors font-medium">About Us</a></li>
                                <li><span onClick={() => navigate('/contact')} className="text-gray-500 hover:text-indigo-600 transition-colors font-medium cursor-pointer">Contact</span></li>
                                <li><span onClick={() => navigate('/privacy')} className="text-gray-500 hover:text-indigo-600 transition-colors font-medium cursor-pointer">Privacy Policy</span></li>
                                <li><span onClick={() => navigate('/terms')} className="text-gray-500 hover:text-indigo-600 transition-colors font-medium cursor-pointer">Terms of Service</span></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-gray-400 text-sm font-medium">
                            © {new Date().getFullYear()} BizzOps. Built for SMEs.
                        </div>
                        <div className="text-gray-400 text-sm flex gap-6">
                            <span className="hover:text-gray-600 cursor-pointer transition-colors">Support</span>
                            <span className="hover:text-gray-600 cursor-pointer transition-colors">System Status</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default Landing;
