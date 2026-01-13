import React, { useState } from "react";
import logo from '../assets/logo2.png';
import { useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faChartLine,
    faClockFour,
    faDollar,
    faFileInvoice,
    faMoneyBill,
    faNoteSticky,
    faReceipt,
    faShop,
    faUser,
    faUsers,
    faBars,
    faTimes,
    faTruck
} from "@fortawesome/free-solid-svg-icons";

function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);

    const isActive = (path) => location.pathname === path;

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    return (
        <>
            <div className="sm:hidden absolute top-7 left-0 h-20">
                <button onClick={toggleSidebar}>
                    <FontAwesomeIcon icon={isOpen ? faTimes : faBars} className="text-white text-2xl ml-4" />
                </button>
            </div>
            <div className="w-1/6 min-h-screen sticky top-0 left-0 bg-[#28282B] hidden sm:block">
                <img className="pt-10 ml-6 mb-10 w-40 h-20" src={logo} alt="logo" />

                <h1 onClick={() => navigate('/Dashboard')} className="font-poppins font-medium text-md ml-7 mt-7 cursor-pointer">
                    <FontAwesomeIcon icon={faChartLine} className="text-blue-500 pr-2" />
                    <span className={`${isActive('/Dashboard') ? 'text-blue-300' : 'text-white'}`}>
                        Dashboard
                    </span>
                </h1>

                <h1 onClick={() => navigate('/Inventory')} className="font-poppins font-medium text-md ml-7 mt-7 cursor-pointer">
                    <FontAwesomeIcon icon={faShop} className="text-green-600 pr-2" />
                    <span className={`${isActive('/Inventory') ? 'text-blue-300' : 'text-white'}`}>
                        Inventory
                    </span>
                </h1>

                <h1 onClick={() => navigate('/Product')} className="font-poppins font-medium text-md ml-7 mt-7 cursor-pointer">
                    <FontAwesomeIcon icon={faShop} className="text-cyan-500 pr-2" />
                    <span className={`${isActive('/Product') ? 'text-blue-300' : 'text-white'}`}>
                        Products
                    </span>
                </h1>

                <h1 onClick={() => navigate('/Sales')} className="font-poppins font-medium text-md ml-7 mt-7 cursor-pointer">
                    <FontAwesomeIcon icon={faMoneyBill} className="text-yellow-500 pr-2" />
                    <span className={`${isActive('/Sales') ? 'text-blue-300' : 'text-white'}`}>
                        Sales
                    </span>
                </h1>

                <h1 onClick={() => navigate('/Invoices')} className="font-poppins font-medium text-md ml-7 mt-7 cursor-pointer">
                    <FontAwesomeIcon icon={faFileInvoice} className="text-purple-500 pr-2" />
                    <span className={`${isActive('/Invoices') ? 'text-blue-300' : 'text-white'}`}>
                        Invoices
                    </span>
                </h1>

                <h1 onClick={() => navigate('/Report')} className="font-poppins font-medium text-md ml-7 mt-7 cursor-pointer">
                    <FontAwesomeIcon icon={faReceipt} className="text-orange-500 pr-2" />
                    <span className={`${isActive('/Report') ? 'text-blue-300' : 'text-white'}`}>
                        Report
                    </span>
                </h1>

                <h1 onClick={() => navigate('/Expenses')} className="font-poppins font-medium text-md ml-7 mt-7 cursor-pointer">
                    <FontAwesomeIcon icon={faDollar} className="text-red-500 pr-2" />
                    <span className={`${isActive('/Expenses') ? 'text-blue-300' : 'text-white'}`}>
                        Expenses
                    </span>
                </h1>

                <h1 onClick={() => navigate('/Payment')} className="font-poppins font-medium text-md ml-7 mt-7 cursor-pointer">
                    <FontAwesomeIcon icon={faMoneyBill} className="text-teal-500 pr-2" />
                    <span className={`${isActive('/Payment') ? 'text-blue-300' : 'text-white'}`}>
                        Payment
                    </span>
                </h1>

                <h1 onClick={() => navigate('/Orders')} className="font-poppins font-medium text-md ml-7 mt-7 cursor-pointer">
                    <FontAwesomeIcon icon={faClockFour} className="text-indigo-500 pr-2" />
                    <span className={`${isActive('/Orders') ? 'text-blue-300' : 'text-white'}`}>
                        Orders
                    </span>
                </h1>

                <h1 onClick={() => navigate('/Customer')} className="font-poppins font-medium text-md ml-7 mt-7 cursor-pointer">
                    <FontAwesomeIcon icon={faUser} className="text-pink-500 pr-2" />
                    <span className={`${isActive('/Customer') ? 'text-blue-300' : 'text-white'}`}>
                        Customer
                    </span>
                </h1>

                <h1 onClick={() => navigate('/Vendor')} className="font-poppins font-medium text-md ml-7 mt-7 cursor-pointer">
                    <FontAwesomeIcon icon={faTruck} className="text-amber-500 pr-2" />
                    <span className={`${isActive('/Vendor') ? 'text-blue-300' : 'text-white'}`}>
                        Vendor
                    </span>
                </h1>

                <h1 onClick={() => navigate('/Staff')} className="font-poppins font-medium text-md ml-7 mt-7 cursor-pointer">
                    <FontAwesomeIcon icon={faUsers} className="text-gray-600 pr-2" />
                    <span className={`${isActive('/Staff') ? 'text-blue-300' : 'text-white'}`}>
                        Staff
                    </span>
                </h1>

                <h1 onClick={() => navigate('/Notes')} className="font-poppins font-medium text-md ml-7 mt-7 mb-2 cursor-pointer">
                    <FontAwesomeIcon icon={faNoteSticky} className="text-lime-500 pr-2" />
                    <span className={`${isActive('/Notes') ? 'text-blue-300' : 'text-white'}`}>
                        Notes
                    </span>
                </h1>
            </div>


            <div className={`fixed top-0 left-0 w-2/4 h-[calc(100vh)] bg-[#28282B] z-40 transform ${isOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out sm:hidden`}>
                <div className="p-4 flex justify-between items-center">
                    <img className="w-24 h-6 mt-6" src={logo} alt="logo" />
                    <button onClick={toggleSidebar}>
                        <FontAwesomeIcon icon={faTimes} className="text-white text-xl mt-6" />
                    </button>
                </div>

                <div className="mt-10 ">
                    <h1 onClick={() => { navigate('/Dashboard'); toggleSidebar(); }} className="font-poppins font-light text-base ml-7 mt-7 cursor-pointer">
                        <FontAwesomeIcon icon={faChartLine} className="text-blue-500 pr-2" />
                        <span className={`${isActive('/Dashboard') ? 'text-blue-300' : 'text-white'}`}>
                            Dashboard
                        </span>
                    </h1>

                    <h1 onClick={() => { navigate('/Inventory'); toggleSidebar(); }} className="font-poppins font-light text-base ml-7 mt-7 cursor-pointer">
                        <FontAwesomeIcon icon={faShop} className="text-green-600 pr-2" />
                        <span className={`${isActive('/Inventory') ? 'text-blue-300' : 'text-white'}`}>
                            Inventory
                        </span>
                    </h1>

                    <h1 onClick={() => { navigate('/Product'); toggleSidebar(); }} className="font-poppins font-light text-base ml-7 mt-7 cursor-pointer">
                        <FontAwesomeIcon icon={faShop} className="text-cyan-500 pr-2" />
                        <span className={`${isActive('/Product') ? 'text-blue-300' : 'text-white'}`}>
                            Products
                        </span>
                    </h1>

                    <h1 onClick={() => { navigate('/Sales'); toggleSidebar(); }} className="font-poppins font-light text-base ml-7 mt-7 cursor-pointer">
                        <FontAwesomeIcon icon={faMoneyBill} className="text-yellow-500 pr-2" />
                        <span className={`${isActive('/Sales') ? 'text-blue-300' : 'text-white'}`}>
                            Sales
                        </span>
                    </h1>

                    <h1 onClick={() => { navigate('/Invoices'); toggleSidebar(); }} className="font-poppins font-light text-base ml-7 mt-7 cursor-pointer">
                        <FontAwesomeIcon icon={faFileInvoice} className="text-purple-500 pr-2" />
                        <span className={`${isActive('/Invoices') ? 'text-blue-300' : 'text-white'}`}>
                            Invoices
                        </span>
                    </h1>

                    <h1 onClick={() => { navigate('/Report'); toggleSidebar(); }} className="font-poppins font-light text-base ml-7 mt-7 cursor-pointer">
                        <FontAwesomeIcon icon={faReceipt} className="text-orange-500 pr-2" />
                        <span className={`${isActive('/Report') ? 'text-blue-300' : 'text-white'}`}>
                            Report
                        </span>
                    </h1>

                    <h1 onClick={() => { navigate('/Expenses'); toggleSidebar(); }} className="font-poppins font-light text-base ml-7 mt-7 cursor-pointer">
                        <FontAwesomeIcon icon={faDollar} className="text-red-500 pr-2" />
                        <span className={`${isActive('/Expenses') ? 'text-blue-300' : 'text-white'}`}>
                            Expenses
                        </span>
                    </h1>

                    <h1 onClick={() => { navigate('/Payment'); toggleSidebar(); }} className="font-poppins font-light text-base ml-7 mt-7 cursor-pointer">
                        <FontAwesomeIcon icon={faMoneyBill} className="text-teal-500 pr-2" />
                        <span className={`${isActive('/Payment') ? 'text-blue-300' : 'text-white'}`}>
                            Payment
                        </span>
                    </h1>

                    <h1 onClick={() => { navigate('/Orders'); toggleSidebar(); }} className="font-poppins font-light text-base ml-7 mt-7 cursor-pointer">
                        <FontAwesomeIcon icon={faClockFour} className="text-indigo-500 pr-2" />
                        <span className={`${isActive('/Orders') ? 'text-blue-300' : 'text-white'}`}>
                            Orders
                        </span>
                    </h1>

                    <h1 onClick={() => { navigate('/Customer'); toggleSidebar(); }} className="font-poppins font-light text-base ml-7 mt-7 cursor-pointer">
                        <FontAwesomeIcon icon={faUser} className="text-pink-500 pr-2" />
                        <span className={`${isActive('/Customer') ? 'text-blue-300' : 'text-white'}`}>
                            Customer
                        </span>
                    </h1>

                    <h1 onClick={() => { navigate('/Vendor'); toggleSidebar(); }} className="font-poppins font-light text-base ml-7 mt-7 cursor-pointer">
                        <FontAwesomeIcon icon={faTruck} className="text-amber-500 pr-2" />
                        <span className={`${isActive('/Vendor') ? 'text-blue-300' : 'text-white'}`}>
                            Vendor
                        </span>
                    </h1>

                    <h1 onClick={() => { navigate('/Staff'); toggleSidebar(); }} className="font-poppins font-light text-base ml-7 mt-7 cursor-pointer">
                        <FontAwesomeIcon icon={faUsers} className="text-gray-600 pr-2" />
                        <span className={`${isActive('/Staff') ? 'text-blue-300' : 'text-white'}`}>
                            Staff
                        </span>
                    </h1>

                    <h1 onClick={() => { navigate('/Notes'); toggleSidebar(); }} className="font-poppins font-light text-base ml-7 mt-5 mb-2 cursor-pointer">
                        <FontAwesomeIcon icon={faNoteSticky} className="text-lime-500 pr-2" />
                        <span className={`${isActive('/Notes') ? 'text-blue-300' : 'text-white'}`}>
                            Notes
                        </span>
                    </h1>
                </div>
            </div>
        </>
    );
}

export default Sidebar;
