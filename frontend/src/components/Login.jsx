import React, { useState } from "react";
import axios from "axios";
import logo from '../assets/logo2.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faEnvelope, faLock, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from "react-router-dom";
import { useAuth } from "./Context/AuthContext";

function Login() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorPopup, setErrorPopup] = useState("")
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
                    navigate('/dashboard')
                }

            }
            console.log(response.data.message);
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            if (errorMessage === 'Request failed with status code 401') {
                const newError = 'Invalid Email Or Password'
                setErrorPopup(newError)
            } else {
                setErrorPopup(errorMessage);
            }

            setTimeout(() => {
                setErrorPopup("");
            }, 2000);
            console.error("Error during login:", error.response?.data || error.message);
        } finally {
            setIsLoading(false);
        }
    }

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <>
            <div className="w-full h-screen sm:flex sm:justify-center sm:items-center bg-[#141415]">
                <div className="sm:w-1/4 sm:m-28 sm:mt-20 ">
                    <img src={logo} alt="" className="w-24 h-6 sm:w-auto sm:h-auto xl:w-36 xl:h-9 absolute top-6 left-8" onClick={() => { navigate('/') }} />
                    <form onSubmit={handleLogin} className="p-8 mt-20">
                        <h2 className="text-4xl text-white font-poppins font-bold mb-10">Sign In</h2>
                        <div className="relative mb-4">
                            <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-4 text-zinc-300" />
                            <input
                                type="text"
                                placeholder="Email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3 pl-10 mb-4 bg-[#2b2b2e] shadow-xl text-white font-medium rounded-2xl placeholder-zinc-300"
                                disabled={isLoading}
                            />
                        </div>
                        <div className="relative mb-4">
                            <FontAwesomeIcon icon={faLock} className="absolute left-3 top-4 text-zinc-300" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 pl-10 pr-10 mb-4 bg-[#2b2b2e] shadow-xl rounded-2xl font-medium text-white placeholder-zinc-300"
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="absolute right-3 top-4 text-zinc-300 hover:text-white transition-colors"
                                disabled={isLoading}
                            >
                                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="absolute right-4 text-zinc-300" />
                            </button>
                        </div>
                        <div className='relative mb-4' onClick={() => navigate('/register')}>
                            <p className='text-xs ml-2 font-font4 font-medium text-zinc-300'>
                                Don't have an account? <span className="text-zinc-200 font-bold underline cursor-pointer">Sign up</span>
                            </p>
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-2/5 py-3 font-poppins font-bold rounded-full transition-all duration-500 ${isLoading
                                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                    : 'bg-white text-black hover:bg-gray-200 hover:scale-110'
                                }`}
                        >
                            {isLoading ? 'Signing In...' : 'Login'}
                        </button>
                    </form>
                </div>
                <div className="sm:w-3/5 sm:m-20 w-11/12 m-10">
                    <div>
                        {/* <img src={logo} alt="" srcset="" className="hidden sm:block sm:w-auto sm:h-auto w-26 h-10" /> */}
                        <h1 className="text-3xl text-white font-poppins font-normal mt-5">Manage Your Business, Smarter and Faster.</h1>
                        <p className="text-xl text-zinc-400 mt-9">
                            Streamline your operations and gain insights to make informed decisions.Join us and take the first step towards optimizing your business today!
                        </p>
                        <h1 className="font-poppins text-zinc-400 font-light mt-4"><FontAwesomeIcon icon={faCheck} className="text-zinc-400 pr-4" />Ultimate Business Tool</h1>
                        <h1 className="font-poppins text-zinc-400 font-light mt-4"><FontAwesomeIcon icon={faCheck} className="text-zinc-400 pr-4" />Run and Scale Your CRM ERP Apps</h1>
                        <h1 className="font-poppins text-zinc-400 font-light mt-4"><FontAwesomeIcon icon={faCheck} className="text-zinc-400 pr-4" />Easily Add And Manage Your Services</h1>
                        <h1 className="font-poppins text-zinc-400 font-light mt-4"><FontAwesomeIcon icon={faCheck} className="text-zinc-400 pr-4" />It Bring Together Your Invoices,Clients And Leads</h1>
                    </div>
                </div>

                {errorPopup && (
                    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-5 bg-red-300 font-medium font-poppins px-6 py-3 rounded-full">
                        <FontAwesomeIcon icon={faLock} className="text-red-500 mr-2" />
                        <span className="text-red-700 font-poppins">{errorPopup}</span>
                    </div>
                )}
            </div>
        </>
    );
}

export default Login;