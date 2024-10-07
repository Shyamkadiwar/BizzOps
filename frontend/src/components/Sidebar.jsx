import React from "react";
import logo from '../assets/logo.png';
import { useNavigate } from "react-router-dom";
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
    faUsers 
} from "@fortawesome/free-solid-svg-icons";

function Sidebar() {
    const navigate = useNavigate();
    
    return (
        <div className="w-1/6 min-h-screen sticky top-0 left-0 bg-blue-50">
            <img className="pt-10 ml-6 mb-10 w-40 h-20" src={logo} alt="logo" />
            <h1 onClick={() => navigate('/Dashboard')} className="font-font4 font-medium text-md ml-7 mt-7 cursor-pointer">
                <FontAwesomeIcon icon={faChartLine} className="text-blue-600 pr-2" /> Dashboard
            </h1>
            <h1 onClick={() => navigate('/Inventory')} className="font-font4 font-medium text-md ml-7 mt-7 cursor-pointer">
                <FontAwesomeIcon icon={faShop} className="text-green-600 pr-2" /> Inventory
            </h1>
            <h1 onClick={() => navigate('/Sales')} className="font-font4 font-medium text-md ml-7 mt-7 cursor-pointer">
                <FontAwesomeIcon icon={faMoneyBill} className="text-yellow-500 pr-2" /> Sales
            </h1>
            <h1 onClick={() => navigate('/Invoices')} className="font-font4 font-medium text-md ml-7 mt-7 cursor-pointer">
                <FontAwesomeIcon icon={faFileInvoice} className="text-purple-500 pr-2" /> Invoices
            </h1>
            <h1 onClick={() => navigate('/Expenses')} className="font-font4 font-medium text-md ml-7 mt-7 cursor-pointer">
                <FontAwesomeIcon icon={faDollar} className="text-red-500 pr-2" /> Expenses
            </h1>
            <h1 onClick={() => navigate('/Payment')} className="font-font4 font-medium text-md ml-7 mt-7 cursor-pointer">
                <FontAwesomeIcon icon={faMoneyBill} className="text-teal-500 pr-2" /> Payment
            </h1>
            <h1 onClick={() => navigate('/Report')} className="font-font4 font-medium text-md ml-7 mt-7 cursor-pointer">
                <FontAwesomeIcon icon={faReceipt} className="text-orange-500 pr-2" /> Report
            </h1>
            <h1 onClick={() => navigate('/Orders')} className="font-font4 font-medium text-md ml-7 mt-7 cursor-pointer">
                <FontAwesomeIcon icon={faClockFour} className="text-indigo-500 pr-2" /> Orders
            </h1>
            <h1 onClick={() => navigate('/Customer')} className="font-font4 font-medium text-md ml-7 mt-7 cursor-pointer">
                <FontAwesomeIcon icon={faUser} className="text-pink-500 pr-2" /> Customer
            </h1>
            <h1 onClick={() => navigate('/Staff')} className="font-font4 font-medium text-md ml-7 mt-7 cursor-pointer">
                <FontAwesomeIcon icon={faUsers} className="text-gray-600 pr-2" /> Staff
            </h1>
            <h1 onClick={() => navigate('/Notes')} className="font-font4 font-medium text-md ml-7 mt-7 mb-2 cursor-pointer">
                <FontAwesomeIcon icon={faNoteSticky} className="text-lime-500 pr-2" /> Notes
            </h1>
        </div>
    );
}

export default Sidebar;
