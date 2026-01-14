import { faPencil, faSignOut, faUser, faShield } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./Context/AuthContext";
import Security from "./Security";

function Account() {
    const { logout } = useAuth()
    const navigate = useNavigate();
    const [isPopupVisible, setPopupVisible] = useState(false);
    const [isEditPopupVisible, setEditPopupVisible] = useState(false);
    const [isSecurityVisible, setSecurityVisible] = useState(false);
    const [userDetails, setUserDetails] = useState({
        businessName: '',
        email: '',
        name: '',
        phoneNo: '',
        address: '',
    });
    const [newDetails, setNewDetails] = useState({ ...userDetails });
    const [message, setMessage] = useState('');

    const fetchData = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/get-details`, { withCredentials: true });
            if (response.data.statusCode === 200) {
                setUserDetails(response.data.data);
                setNewDetails(response.data.data);

            }
        } catch (error) {
            console.error("Error while fetching data", error.response?.data || error.message);
        }
    };

    const handleEditAccount = async (e) => {
        e.preventDefault();
        if (!newDetails.businessName || !newDetails.email || !newDetails.name || !newDetails.phoneNo || !newDetails.address) {
            setMessage("All fields are required");
            return;
        }

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/users/update-account`,
                newDetails,
                { withCredentials: true }
            );

            if (response.data.statusCode === 200) {
                setMessage("Details updated successfully");
                setUserDetails(newDetails); // Update the displayed details
                handleEditClose(); // Close the edit popup
            } else {
                setMessage("Error updating account: " + response.data.message);
            }
        } catch (error) {
            setMessage("Error while updating account: " + (error.response?.data || error.message));
        }
    };

    const handleLogOut = async () => {
        try {
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/logout`, {}, { withCredentials: true });
            if (response.data.statusCode === 200) {
                console.log("User logged out");
                localStorage.removeItem('accessToken');
                localStorage.removeItem('sessionId');
                logout()
                navigate('/');
            }
        } catch (error) {
            console.error("Error while logging out", error.message);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleClosePopup = () => {
        setPopupVisible(false);
        setMessage('');
    };

    const handleOpenPopup = () => {
        setPopupVisible(true);
    };

    const handleEditOpen = () => {
        setEditPopupVisible(true);
    };

    const handleEditClose = () => {
        setEditPopupVisible(false);
        setNewDetails(userDetails);
    };

    return (
        <>
            <div>
                <button
                    onClick={handleOpenPopup}
                    className="sm:w-11 sm:h-11 h-10 w-10 sm:text-lg text-sm bg-gradient-to-r from-blue-300 text-center to-indigo-300 text-gray-700-400 font-normal font-poppins rounded-full hover:bg-gradient-to-bl transition"
                >
                    <FontAwesomeIcon icon={faUser} />
                </button>
            </div>

            {isPopupVisible && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                    <div className="bg-[#28282B] sm:w-3/12 w-3/4 rounded-3xl p-6">
                        <h2 className="text-sm text-white font-semibold text-center">Account</h2>
                        <h2 className="text-3xl text-white font-bold text-center m-4">{userDetails.businessName}</h2>
                        <p className="mt-2 text-center m-2 text-white text-lg">{userDetails.email}</p>
                        <p className="mt-2 text-center m-2 text-white text-lg">{userDetails.name}</p>
                        <p className="mt-2 text-center m-2 text-white text-lg">{userDetails.phoneNo}</p>
                        <p className="mt-2 text-center m-2 mb-10 text-white text-lg">{userDetails.address}</p>
                        {message && <p className="text-red-500 text-center">{message}</p>}

                        {/* Security Button */}
                        <div className="mb-4 flex justify-center">
                            <button
                                onClick={() => { setSecurityVisible(true); handleClosePopup(); }}
                                className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all font-poppins text-sm"
                            >
                                <FontAwesomeIcon icon={faShield} className="mr-2" />
                                Security & Sessions
                            </button>
                        </div>

                        <div className="mt-4 flex justify-end gap-4">
                            <button
                                onClick={() => { handleEditOpen(); handleClosePopup(); }}
                                className="text-white mr-10 sm:text-xs text-sm hover:text-gray-400"
                            >
                                <FontAwesomeIcon icon={faPencil} />
                            </button>
                            <button
                                onClick={handleClosePopup}
                                className="text-blue-400 font-poppins font-semibold hover:text-blue-300"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleLogOut}
                                className="text-[#f84242] font-normal hover:text-[#b64141] font-poppins"
                            >
                                <FontAwesomeIcon icon={faSignOut} className="mr-2" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Security Component */}
            <Security
                isVisible={isSecurityVisible}
                onClose={() => setSecurityVisible(false)}
            />

            {isEditPopupVisible && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                    <div className="bg-[#28282B] sm:w-3/12 w-3/4 rounded-3xl p-6">
                        <h2 className="text-sm font-poppins text-white font-semibold text-center mb-5">Edit Account</h2>
                        <form onSubmit={handleEditAccount}>
                            <label className='pl-1 text-xs font-poppins text-zinc-500 font-thin m-2'>Business Name</label>
                            <input
                                type="text"
                                placeholder="Business Name"
                                required
                                value={newDetails.businessName}
                                onChange={(e) => setNewDetails({ ...newDetails, businessName: e.target.value })}
                                className="w-full text-sm p-3 pl-10 mb-4 bg-[#2b2b2e] shadow-xl text-white font-poppins font-normal placeholder-gray-700 rounded-2xl"
                            />
                            <label className='pl-1 text-xs font-poppins text-zinc-500 font-thin m-2'>Email</label>
                            <input
                                type="email"
                                placeholder="Email"
                                required
                                value={newDetails.email}
                                onChange={(e) => setNewDetails({ ...newDetails, email: e.target.value })}
                                className="w-full text-sm p-3 pl-10 mb-4 bg-[#2b2b2e] shadow-xl text-white font-poppins font-normal placeholder-gray-700 rounded-2xl"
                            />
                            <label className='pl-1 text-xs font-poppins text-zinc-500 font-thin m-2'>Name</label>
                            <input
                                type="text"
                                placeholder="Name"
                                required
                                value={newDetails.name}
                                onChange={(e) => setNewDetails({ ...newDetails, name: e.target.value })}
                                className="w-full text-sm p-3 pl-10 mb-4 bg-[#2b2b2e] shadow-xl text-white font-poppins font-normal placeholder-gray-700 rounded-2xl"
                            />
                            <label className='pl-1 text-xs font-poppins text-zinc-500 font-thin m-2'>Phone no</label>
                            <input
                                type="text"
                                placeholder="Phone No"
                                required
                                value={newDetails.phoneNo}
                                onChange={(e) => setNewDetails({ ...newDetails, phoneNo: e.target.value })}
                                className="w-full text-sm p-3 pl-10 mb-4 bg-[#2b2b2e] shadow-xl text-white font-poppins font-normal placeholder-gray-700 rounded-2xl"
                            />
                            <label className='pl-1 text-xs font-poppins text-zinc-500 font-thin m-2'>Address</label>
                            <input
                                type="text"
                                placeholder="Address"
                                required
                                value={newDetails.address}
                                onChange={(e) => setNewDetails({ ...newDetails, address: e.target.value })}
                                className="w-full text-sm p-3 pl-10 mb-4 bg-[#2b2b2e] shadow-xl text-white font-poppins font-normal placeholder-gray-700 rounded-2xl"
                            />
                            <div className="mt-4 flex justify-end gap-4">
                                <button
                                    type="submit"
                                    className="text-blue-400 hover:text-blue-300 font-poppins font-semibold "
                                >
                                    Save
                                </button>
                                <button
                                    onClick={handleEditClose}
                                    type="button"
                                    className="text-[#f84242] font-semibold hover:text-[#b64141] font-poppins"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export default Account;
