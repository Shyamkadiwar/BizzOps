import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import logo from '../assets/logo.png';

function Privacy() {
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
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
                    <p className="text-gray-500 mb-8 pb-8 border-b border-gray-100">Last Updated: {new Date().toLocaleDateString()}</p>
                    
                    <div className="space-y-8 text-gray-600 leading-relaxed">
                        <section>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">1. Information Collection</h2>
                            <p>We collect information to provide better services to all our users. We may collect personal information such as your name, email address, and business details when you register for BizzOps.</p>
                        </section>

                        <section>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">2. Use of Information</h2>
                            <p>We use the information we collect to provide, maintain, protect and improve our services, to develop new ones, and to protect BizzOps and our users. We also use this information to offer you tailored content.</p>
                        </section>

                        <section>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">3. Data Security</h2>
                            <p>We work hard to protect BizzOps and our users from unauthorized access to or unauthorized alteration, disclosure or destruction of information we hold. We review our information collection, storage, and processing practices regularly.</p>
                        </section>

                        <section>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">4. Sharing of Information</h2>
                            <p>We do not share personal information with companies, organizations, and individuals outside of BizzOps unless one of the following circumstances applies: with your consent, for external processing, or for legal reasons.</p>
                        </section>

                        <section>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">5. Contact Us</h2>
                            <p>If you have any questions about this Privacy Policy, please contact us at support@bizzops.com.</p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Privacy;
