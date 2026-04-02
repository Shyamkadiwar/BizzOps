import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import logo from '../assets/logo.png';

function Terms() {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-[#F5F5FA] font-poppins text-gray-800">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
                <img src={logo} alt="BizzOps Logo" className="h-8 cursor-pointer" onClick={() => navigate('/')} />
                <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-indigo-600 transition-colors">
                    <ArrowLeft size={18} /> Back to Home
                </button>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
                    <p className="text-gray-500 mb-8 pb-8 border-b border-gray-100">Last Updated: {new Date().toLocaleDateString()}</p>
                    
                    <div className="space-y-8 text-gray-600 leading-relaxed">
                        <section>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
                            <p>Welcome to BizzOps. By accessing our website and using our services, you agree to be bound by these Terms of Service. Please read them carefully.</p>
                        </section>

                        <section>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">2. Use of Service</h2>
                            <p>BizzOps provides a comprehensive business management platform. You agree to use the service for lawful business purposes and in a way that does not infringe the rights of others or restrict their use.</p>
                        </section>

                        <section>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
                            <p>You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. BizzOps cannot and will not be liable for any loss or damage arising from your failure to comply.</p>
                        </section>

                        <section>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">4. Subscriptions and Payments</h2>
                            <p>Some parts of the Service are billed on a subscription basis. You will be billed in advance on a recurring schedule. Refunds are processed according to our refund policy available upon request.</p>
                        </section>

                        <section>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">5. Disclaimer</h2>
                            <p>Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind.</p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Terms;
