import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Box, Typography, TextField, CircularProgress, Alert } from '@mui/material';
import { Save, KeyRound, ShieldCheck, Webhook, Building2, User, Phone, MapPin, Mail, Globe, FileText, Image as ImageIcon, UploadCloud } from 'lucide-react';
import Layout from "../components/Layout";

const token = localStorage.getItem('accessToken');

function SettingsPage() {
    const [activeTab, setActiveTab] = useState("profile");
    
    // Global States
    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPayments, setSavingPayments] = useState(false);
    
    const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
    const [paymentMessage, setPaymentMessage] = useState({ type: '', text: '' });
    
    // Profile Data
    const [userDetails, setUserDetails] = useState({
        businessName: '',
        email: '',
        name: '',
        phoneNo: '',
        address: '',
        gstNumber: '',
        website: '',
        businessLogo: ''
    });

    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);

    // Payment Data
    const [keys, setKeys] = useState({
        razorpayKeyId: '',
        razorpayKeySecret: '',
        razorpayWebhookSecret: ''
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch User Details
            const profileResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/get-details`, { withCredentials: true });
            if (profileResponse.data.statusCode === 200) {
                const data = profileResponse.data.data;
                setUserDetails({
                    businessName: data.businessName || '',
                    email: data.email || '',
                    name: data.name || '',
                    phoneNo: data.phoneNo || '',
                    address: data.address || '',
                    gstNumber: data.gstNumber || '',
                    website: data.website || '',
                    businessLogo: data.businessLogo || ''
                });
                if (data.businessLogo) {
                    setLogoPreview(data.businessLogo);
                }
            }

            // Fetch Payment Details
            const paymentResponse = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/users/payment-settings`,
                { headers: { 'Authorization': token }, withCredentials: true }
            );

            if (paymentResponse.status === 200 && paymentResponse.data && paymentResponse.data.data) {
                setKeys({
                    razorpayKeyId: paymentResponse.data.data.razorpayKeyId || '',
                    razorpayKeySecret: paymentResponse.data.data.razorpayKeySecret || '',
                    razorpayWebhookSecret: paymentResponse.data.data.razorpayWebhookSecret || ''
                });
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        setProfileMessage({ type: '', text: '' });

        try {
            const formData = new FormData();
            formData.append('name', userDetails.name);
            formData.append('email', userDetails.email);
            formData.append('businessName', userDetails.businessName);
            formData.append('phoneNo', userDetails.phoneNo);
            formData.append('address', userDetails.address);
            formData.append('gstNumber', userDetails.gstNumber);
            formData.append('website', userDetails.website);
            
            if (logoFile) {
                formData.append('businessLogo', logoFile);
            }

            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/users/update-account`,
                formData,
                { 
                    withCredentials: true,
                    headers: { 'Content-Type': 'multipart/form-data' }
                }
            );

            if (response.data.statusCode === 200) {
                setProfileMessage({ type: 'success', text: 'Business profile updated successfully!' });
                
                // Update local logo state in case a new remote one is returned
                if (response.data.data.businessLogo) {
                    setLogoPreview(response.data.data.businessLogo);
                }
                setLogoFile(null); // Reset file input
            } else {
                setProfileMessage({ type: 'error', text: response.data.message || 'Error updating profile' });
            }
        } catch (error) {
            setProfileMessage({ type: 'error', text: error.response?.data?.message || 'Error updating profile' });
        } finally {
            setSavingProfile(false);
            setTimeout(() => setProfileMessage({ type: '', text: '' }), 4000);
        }
    };

    const handleSavePayments = async (e) => {
        e.preventDefault();
        setSavingPayments(true);
        setPaymentMessage({ type: '', text: '' });

        try {
            await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/users/payment-settings`,
                keys,
                { headers: { 'Authorization': token }, withCredentials: true }
            );
            setPaymentMessage({ type: 'success', text: 'Payment settings saved successfully!' });
            // Re-fetch to see the newly masked secrets
            fetchData();
        } catch (error) {
            setPaymentMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
        } finally {
            setSavingPayments(false);
            setTimeout(() => setPaymentMessage({ type: '', text: '' }), 4000);
        }
    };

    const handleProfileChange = (e) => {
        setUserDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handlePaymentChange = (e) => {
        setKeys(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    return (
        <Layout>
            <div className="min-h-screen bg-[#F5F5FA] font-poppins p-4 md:p-8">
                
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Account Settings</h1>
                        <p className="text-gray-500 mt-2 font-medium">Manage your business profile, security, and integrations.</p>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="flex flex-wrap gap-2 mb-8 bg-white/50 p-1.5 rounded-2xl shadow-sm border border-gray-100 max-w-fit">
                        <button 
                            onClick={() => setActiveTab('profile')}
                            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${activeTab === 'profile' ? 'bg-white text-indigo-700 shadow border border-gray-100' : 'text-gray-500 hover:text-gray-800 hover:bg-white/60'}`}
                        >
                            <Building2 size={16} /> Business Profile
                        </button>
                        <button 
                            onClick={() => setActiveTab('payments')}
                            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${activeTab === 'payments' ? 'bg-white text-indigo-700 shadow border border-gray-100' : 'text-gray-500 hover:text-gray-800 hover:bg-white/60'}`}
                        >
                            <ShieldCheck size={16} /> Payment Gateway
                        </button>
                    </div>

                    {/* Main Content Area */}
                    <div className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2rem] overflow-hidden min-h-[400px]">
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <CircularProgress />
                            </div>
                        ) : (
                            <>
                                {/* TAB 1: Business Profile */}
                                {activeTab === 'profile' && (
                                    <div className="animate-fade-in">
                                        <div className="px-6 md:px-10 py-8 border-b border-gray-100">
                                            <h2 className="text-xl font-bold text-gray-900 mb-1">Business Profile</h2>
                                            <p className="text-sm font-medium text-gray-500">Update your company's core details, branding, and contact information.</p>
                                        </div>

                                        <form onSubmit={handleSaveProfile} className="p-6 md:p-10">
                                            {profileMessage.text && (
                                                <Alert severity={profileMessage.type} sx={{ mb: 4, borderRadius: '12px' }}>
                                                    {profileMessage.text}
                                                </Alert>
                                            )}

                                            {/* Business Logo Upload */}
                                            <div className="mb-8">
                                                <label className="block text-sm font-semibold text-gray-700 mb-4">Business Logo</label>
                                                <div className="flex items-center gap-6">
                                                    <div className="w-24 h-24 rounded-2xl bg-gray-50 border border-gray-200 shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0">
                                                        {logoPreview ? (
                                                            <img src={logoPreview} alt="Business Logo" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <ImageIcon className="text-gray-400" size={32} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:border-indigo-500 hover:text-indigo-600 rounded-xl shadow-sm transition-all text-sm font-semibold text-gray-700">
                                                            <UploadCloud size={18} />
                                                            Upload New Logo
                                                            <input 
                                                                type="file" 
                                                                accept="image/*"
                                                                className="hidden" 
                                                                onChange={handleFileChange}
                                                            />
                                                        </label>
                                                        <p className="text-xs text-gray-400 font-medium mt-2">Recommended: 1:1 aspect ratio, up to 5MB.</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Business Name</label>
                                                        <div className="relative">
                                                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                            <input type="text" name="businessName" placeholder="Acme Corp" required value={userDetails.businessName} onChange={handleProfileChange} className="w-full py-3 pl-11 pr-4 bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all rounded-xl text-gray-900 font-medium" />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Your Full Name</label>
                                                        <div className="relative">
                                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                            <input type="text" name="name" placeholder="John Doe" required value={userDetails.name} onChange={handleProfileChange} className="w-full py-3 pl-11 pr-4 bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all rounded-xl text-gray-900 font-medium" />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-2">GST Number</label>
                                                        <div className="relative">
                                                            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                            <input type="text" name="gstNumber" placeholder="22AAAAA0000A1Z5" value={userDetails.gstNumber} onChange={handleProfileChange} className="w-full py-3 pl-11 pr-4 bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all rounded-xl text-gray-900 font-medium" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                                        <div className="relative">
                                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                            <input type="email" name="email" placeholder="contact@acme.com" required value={userDetails.email} onChange={handleProfileChange} className="w-full py-3 pl-11 pr-4 bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all rounded-xl text-gray-900 font-medium" />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                                                        <div className="relative">
                                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                            <input type="text" name="phoneNo" placeholder="+1 (555) 000-0000" required value={userDetails.phoneNo} onChange={handleProfileChange} className="w-full py-3 pl-11 pr-4 bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all rounded-xl text-gray-900 font-medium" />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Website</label>
                                                        <div className="relative">
                                                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                            <input type="url" name="website" placeholder="https://www.acme.com" value={userDetails.website} onChange={handleProfileChange} className="w-full py-3 pl-11 pr-4 bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all rounded-xl text-gray-900 font-medium" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mb-8">
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Business Address</label>
                                                <div className="relative">
                                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                    <input type="text" name="address" placeholder="123 Startup Blvd, Suite 100" required value={userDetails.address} onChange={handleProfileChange} className="w-full py-3 pl-11 pr-4 bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all rounded-xl text-gray-900 font-medium" />
                                                </div>
                                            </div>

                                            <div className="pt-6 border-t border-gray-100 flex justify-end">
                                                <button type="submit" disabled={savingProfile} className="flex items-center gap-2 px-8 py-3 bg-gray-900 hover:bg-indigo-600 text-white rounded-xl shadow-[0_8px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_20px_rgba(79,70,229,0.2)] transition-all font-bold disabled:opacity-70 disabled:hover:translate-y-0 hover:-translate-y-0.5">
                                                    {savingProfile ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />}
                                                    {savingProfile ? 'Saving...' : 'Save Profile'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {/* TAB 2: Payment Gateway */}
                                {activeTab === 'payments' && (
                                    <div className="animate-fade-in">
                                        <div className="px-6 md:px-10 py-8 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                                            <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                                                <ShieldCheck size={24} className="text-blue-600" /> Razorpay Integration
                                            </h2>
                                            <p className="text-sm font-medium text-gray-600">Connect your own Razorpay account to collect payments securely directly to your bank.</p>
                                        </div>

                                        <form onSubmit={handleSavePayments} className="p-6 md:p-10">
                                            {paymentMessage.text && (
                                                <Alert severity={paymentMessage.type} sx={{ mb: 4, borderRadius: '12px' }}>
                                                    {paymentMessage.text}
                                                </Alert>
                                            )}

                                            <div className="space-y-6 mb-8 max-w-2xl">
                                                <div>
                                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                                        <KeyRound size={16} className="text-blue-500" /> Razorpay Key ID
                                                    </label>
                                                    <input type="text" name="razorpayKeyId" placeholder="rzp_live_xxxxxxxxxxxxxx" value={keys.razorpayKeyId} onChange={handlePaymentChange} className="w-full py-3 px-4 bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all rounded-xl text-gray-900 font-medium font-mono" />
                                                </div>

                                                <div>
                                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                                        <KeyRound size={16} className="text-indigo-500" /> Razorpay Key Secret
                                                    </label>
                                                    <input type={keys.razorpayKeySecret.includes('••••') ? 'text' : 'password'} name="razorpayKeySecret" placeholder="Paste your key secret here" value={keys.razorpayKeySecret} onChange={handlePaymentChange} className="w-full py-3 px-4 bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all rounded-xl text-gray-900 font-medium font-mono" />
                                                </div>

                                                <div>
                                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                                        <Webhook size={16} className="text-emerald-500" /> Webhook Secret <span className="text-gray-400 font-normal">(Optional)</span>
                                                    </label>
                                                    <input type={keys.razorpayWebhookSecret.includes('••••') ? 'text' : 'password'} name="razorpayWebhookSecret" placeholder="Falls back to Key Secret if empty" value={keys.razorpayWebhookSecret} onChange={handlePaymentChange} className="w-full py-3 px-4 bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all rounded-xl text-gray-900 font-medium font-mono" />
                                                    <p className="text-xs text-gray-400 mt-2 font-medium">Use this to verify webhook payloads hitting your server from Razorpay.</p>
                                                </div>
                                            </div>

                                            <div className="pt-6 border-t border-gray-100 flex justify-end">
                                                <button type="submit" disabled={savingPayments} className="flex items-center gap-2 px-8 py-3 bg-gray-900 hover:bg-indigo-600 text-white rounded-xl shadow-[0_8px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_20px_rgba(79,70,229,0.2)] transition-all font-bold disabled:opacity-70 disabled:hover:translate-y-0 hover:-translate-y-0.5">
                                                    {savingPayments ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />}
                                                    {savingPayments ? 'Saving Integration...' : 'Save Keys'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default SettingsPage;
