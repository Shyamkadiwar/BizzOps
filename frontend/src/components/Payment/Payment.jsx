import React from "react";
import PaymentTable from "./PaymentTable";
import Layout from "../Layout";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faDollar, faMoneyBill } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import ClipLoader from "react-spinners/ClipLoader";
import InvoiceRAGComponent from "../Invoices/InvoiceRAGComponent.jsx";

function Payment() {

    const navigate = useNavigate()
    const [paid, setPaid] = useState(0)
    const [unPaid, setUnPaid] = useState(0)
    const fetchInvoices = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/invoice/paid-invoice`, { withCredentials: true });
            setPaid(response.data.data.totalPaidAmount)
            const unpaidResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/invoice/unpaid-invoice`, { withCredentials: true })
            setUnPaid(unpaidResponse.data.data.totalUnpaidAmount)
        } catch (error) {
            console.error('Error fetching invoices:', error);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    return (
        <>
            <InvoiceRAGComponent />
            <Layout>
                <div id="infoCards" className="overflow-y-auto bg-[#141415] p-4">
                    <h1 className="sm:m-10 m-4 text-2xl text-white font-medium font-poppins"> <FontAwesomeIcon icon={faArrowLeft} className="text-md pr-2" onClick={() => navigate('/dashboard')} /> Payments</h1>
                    <div className="justify-center items-center flex flex-col">
                        <div className="w-4/5">
                            <div className="mt-2 m-9 sm:flex sm:justify-center sm:items-center sm:gap-4">
                                <div className="h-full sm:w-1/5 w-5/6 m-6">
                                    <div className="bg-zinc-700 w-full h-24 shadow-lg rounded-2xl flex flex-col items-center">
                                        <div className="w-full bg-[#232325] shadow-lg h-16  rounded-t-xl">
                                            <p className="text-base text-white font-light font-poppins mt-1 ml-2"> <FontAwesomeIcon icon={faDollar} className="text-sm pr-3 text-green-600" />Paid Payments</p>
                                            <h1 className="text-white mb-1 text-2xl font-medium font-poppins ml-2">₹ {paid ? paid.toLocaleString() : <spam className="text-sm text-center"><ClipLoader color='white' size={15} /> </spam>}</h1>
                                        </div>
                                        <div className="w-11/12 mt-1 ml-">
                                            <p className="font-normal text-white mt-1 font-poppins text-xs">From All Time</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-full sm:w-1/5 w-5/6 m-6">
                                    <div className="bg-zinc-700 w-full h-24 shadow-lg rounded-2xl flex flex-col items-center">
                                        <div className="w-full bg-[#232325] shadow-lg h-16  rounded-t-xl">
                                            <p className="text-base text-white font-light font-poppins mt-1 ml-2"> <FontAwesomeIcon icon={faMoneyBill} className="text-sm pr-3 text-red-400" />Unpaid Payments</p>
                                            <h1 className="text-white mb-1 text-2xl font-medium font-poppins ml-2">₹ {unPaid ? unPaid.toLocaleString() : <spam className="text-sm text-center"><ClipLoader color='white' size={15} /> </spam>}</h1>
                                        </div>
                                        <div className="w-11/12 mt-1 ml-">
                                            <p className="font-normal mt-1 font-poppins text-xs text-white">From All Time</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="m-5 w-5/6"><PaymentTable /></div>
                    </div>
                </div>
            </Layout>
        </>
    )
}


export default Payment