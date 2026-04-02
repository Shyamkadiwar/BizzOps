import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "./Context/AuthContext";
import { User, Settings, LogOut } from 'lucide-react';

function Account() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const [userDetails, setUserDetails] = useState({
        businessName: '',
        email: '',
        name: ''
    });

    const fetchData = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/get-details`, { withCredentials: true });
            if (response.data.statusCode === 200) {
                setUserDetails(response.data.data);
            }
        } catch (error) {
            console.error("Error while fetching data", error.response?.data || error.message);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogOut = async () => {
        try {
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/logout`, {}, { withCredentials: true });
            if (response.data.statusCode === 200) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('sessionId');
                logout();
                navigate('/');
            }
        } catch (error) {
            console.error("Error while logging out", error.message);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 bg-gray-900 text-white rounded-full hover:bg-indigo-600 transition-all shadow-md focus:outline-none"
            >
                <User size={20} />
            </button>

            {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl border border-gray-100 shadow-2xl rounded-2xl py-2 z-[9999] font-poppins transform origin-top-right transition-all">
                    {/* User Profile Header */}
                    <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-bold text-gray-900 truncate">{userDetails.businessName || 'Business Name'}</p>
                        <p className="text-xs text-gray-500 font-medium truncate">{userDetails.email || 'user@example.com'}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2 px-2">
                        <button
                            onClick={() => {
                                setDropdownOpen(false);
                                navigate('/settings');
                            }}
                            className="w-full text-left px-3 py-2 text-sm font-semibold text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center transition-colors"
                        >
                            <Settings size={16} className="mr-3" />
                            Account Settings
                        </button>
                    </div>

                    <div className="py-2 px-2 border-t border-gray-100">
                        <button
                            onClick={handleLogOut}
                            className="w-full text-left px-3 py-2 text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg flex items-center transition-colors"
                        >
                            <LogOut size={16} className="mr-3" />
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Account;
