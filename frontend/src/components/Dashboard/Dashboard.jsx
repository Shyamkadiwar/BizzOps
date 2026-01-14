import React, { useEffect, useState } from "react";
import Layout from "../Layout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCalendar, faChain, faChartArea, faChartGantt, faDollar, faMoneyBill1, faSpinner, faWallet } from "@fortawesome/free-solid-svg-icons";
import InventoryChart from "../Inventory/InventoryChart";
import SalesChart from "../Sales/SalesChart.jsx";
import ProfitChart from "./ProfitChart";
import FinancialChart from "./FinancialCharts";
import FinancialDist from "./FinancialDist";
import axios from "axios";
import ClipLoader from "react-spinners/ClipLoader";


function Dashboard() {

    const [totalSale, setTotalSales] = useState(0)
    const [todaySale, setTodaySales] = useState(0)
    const [MonthSale, setMonthSales] = useState(0)
    const [totalProfit, setTotalProfit] = useState(0)
    const [todayProfit, setTodayProfit] = useState(0)
    const [monthProfit, setMonthProfit] = useState(0)
    const [totalCost, setTotalCost] = useState(0)
    const [totalNetIncome, setTotalNetIncome] = useState(0)
    const [totalExpense, setTotalExpense] = useState(0)
    const [orders, setOrders] = useState(0)
    const [pendingOrders, setPendingOrders] = useState(0)
    const [invoices, setInvoices] = useState(0)
    const [unpaidInvoices, setUnpaidInvoices] = useState(0)
    const [customers, setCustomers] = useState(0)

    const fetchData = async () => {
        try {
            const totalSaleResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/sales/get-total-alltime-sale`, {
                withCredentials: true
            });

            const totalProfitResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/sales/get-total-alltime-profit`, {
                withCredentials: true
            });

            const totalCostResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/sales/get-total-alltime-cost`, {
                withCredentials: true
            });

            const totalExpenseResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/expense/get-alltime-expense`, {
                withCredentials: true
            });

            const todaySaleResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/sales/get-total-oneday-sale`, {
                withCredentials: true
            });

            const todayProfitResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/sales/get-total-one-profit`, {
                withCredentials: true
            });

            const monthSaleResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/sales/get-total-last30Day-sale`, {
                withCredentials: true
            });

            const monthProfitResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/sales/get-total-last30Day-profit`, {
                withCredentials: true
            });
            const orderResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/orders/count-order`, {
                withCredentials: true
            });
            const pendingOrderResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/orders/get-pending-order`, {
                withCredentials: true
            });
            const invoicesResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/invoice/count-invoice`, {
                withCredentials: true
            });
            const unpaidInvoicesResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/invoice/unpaid-invoice`, {
                withCredentials: true
            });
            const customersResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/customer/count-customer`, {
                withCredentials: true
            });

            setTotalSales(totalSaleResponse.data.data.totalSalesValue)
            setMonthSales(monthSaleResponse.data.data.totalSalesValue)
            setTodaySales(todaySaleResponse.data.data.totalSalesValue)
            setTotalProfit(totalProfitResponse.data.data.totalProfitValue)
            setMonthProfit(monthProfitResponse.data.data.totalProfitValue)
            setTodayProfit(todayProfitResponse.data.data.totalProfitValue)
            setTotalCost(totalCostResponse.data.data.totalCostValue)
            setTotalExpense(totalExpenseResponse.data.data.totalExpenseValue)
            setTotalNetIncome(totalProfit - totalExpense)
            setOrders(orderResponse.data.data.totalOrders)
            setPendingOrders(pendingOrderResponse.data.data.pendingCount)
            setInvoices(invoicesResponse.data.data.invoiceCount)
            setUnpaidInvoices(unpaidInvoicesResponse.data.data.totalUnpaidAmount)
            setCustomers(customersResponse.data.data.count)

        } catch (error) {
            console.error("Error while fetching data: ", error)
        }

    }

    useEffect(() => {
        fetchData();
    }, [])

    return (
        <Layout>
            <div id="infoCards" className="overflow-y-auto bg-[#141415] rounded-lg p-4">
                <h1 className="sm:m-10 m-4 text-2xl text-white font-medium font-poppins">Dashboard  </h1>

                <div className="mt-2 m-9 sm:flex sm:justify-center sm:items-center sm:gap-4">
                    <div className="h-full sm:w-1/5 w-5/6 m-6">
                        <div className="bg-zinc-700 w-full h-24 shadow-lg rounded-2xl sm:flex sm:flex-col items-center">
                            <div className="w-full bg-[#232325] shadow-lg h-16  rounded-t-xl">
                                <p className="text-base text-white font-light font-poppins mt-1 ml-2"> <FontAwesomeIcon icon={faChartGantt} className="text-sm pr-1 text-blue-600" /> Total Sales</p>
                                <h1 className="text-white mb-1 text-2xl font-medium font-poppins ml-2">₹ {totalSale ? totalSale.toLocaleString() : <span className="text-sm text-center"><ClipLoader color='white' size={15} /></span>}</h1>
                            </div>
                            <div className="w-11/12 mt-1 ml-3">
                                <p className="font-normal mt-1 text-white font-poppins text-xs">From All Time</p>
                            </div>
                        </div>

                    </div>
                    <div className="h-full sm:w-1/5 w-5/6 m-6">
                        <div className="bg-zinc-700 shadow-lg w-full h-24 rounded-2xl flex flex-col items-center">
                            <div className="w-full bg-[#232325] shadow-lg h-16  rounded-t-xl">
                                <p className="text-base text-white font-light font-poppins mt-1 ml-2"> <FontAwesomeIcon icon={faMoneyBill1} className="text-sm pr-1 text-teal-400" /> Total Profit</p>
                                <h1 className="text-white mb-1 text-2xl font-medium font-poppins ml-2">
                                    ₹ {totalProfit ? totalProfit.toLocaleString() : <spam className="text-sm text-center"><ClipLoader color='white' size={15} /> </spam>}</h1>
                            </div>
                            <div className="w-11/12 mt-1">
                                <p className="font-normal mt-1 text-white font-poppins text-xs">From All Time</p>
                            </div>
                        </div>
                    </div>
                    <div className="h-full sm:w-1/5 w-5/6 m-6">

                        <div className="bg-zinc-700 shadow-lg w-full h-24 rounded-xl flex flex-col items-center">
                            <div className="w-full bg-[#232325] shadow-lg h-16  rounded-t-xl">
                                <p className="text-base text-white font-light font-poppins mt-1 ml-2"> <FontAwesomeIcon icon={faDollar} className="text-red-400 text-sm pr-2" /> Total Cost</p>
                                <h1 className="text-white text-2xl mb-1 font-medium font-poppins ml-2">
                                    ₹ {totalCost ? totalCost.toLocaleString() : <spam className="text-sm text-center"><ClipLoader color='white' size={15} /> </spam>}</h1>
                            </div>
                            <div className="w-11/12 mt-1 ml-">
                                <p className="font-normal mt-1 font-poppins text-xs text-white">From All Time</p>
                            </div>

                        </div>
                    </div>
                    <div className="h-full sm:w-1/5 w-5/6 m-6">
                        <div className="bg-zinc-700 shadow-lg w-full h-24 rounded-xl flex flex-col items-center">
                            <div className="w-full bg-[#232325] shadow-lg h-16  rounded-t-xl">
                                <p className="text-base text-white font-light font-poppins mt-1 ml-2"> <FontAwesomeIcon icon={faWallet} className="text-xs text-green-400 pr-1" /> Total Net Income</p>
                                <h1 className="text-white text-2xl mb-1 font-medium font-poppins ml-2">₹ {totalProfit ? (totalProfit - totalExpense) : <spam className="text-sm text-center"><ClipLoader color='white' size={15} /> </spam>}</h1>
                            </div>
                            <div className="w-11/12 mt-1 ml-">
                                <p className="font-normal mt-1 text-white font-poppins text-xs">From All Time</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="gap-10 m-10 sm:flex sm:justify-center sm:items-center">

                    <div className="sm:w-2/4 sm:mt-4 bg-[#232325] shadow-lg rounded-3xl">
                        <h1 className="text-center text-white font-medium font-poppins sm:mt-4">Last 30 Day's Sales</h1>
                        <div className="mr-3">
                            <SalesChart />
                        </div>
                    </div>

                    <div className="sm:w-1/5 w-5/6 m-6">
                        <div className="h-full">
                            <div className="bg-zinc-700 shadow-lg w-full h-24 rounded-2xl flex flex-col items-center">
                                <div className="w-full bg-[#232325] shadow-lg h-16  rounded-t-xl">
                                    <p className="text-base text-white font-light font-poppins mt-1 ml-2">Sales</p>
                                    <h1 className="text-white mb-1 text-2xl font-medium font-poppins ml-2">₹ {todaySale ? todaySale.toLocaleString() : <spam className="text-sm text-center"><ClipLoader color='white' size={15} /> </spam>} </h1>
                                </div>
                                <div className="w-11/12 mt-1 ml-">
                                    <p className="font-medium mt-1 text-white font-poppins text-xs">Today's</p>
                                </div>
                            </div>
                        </div>
                        <div className="h-full mt-10">
                            <div className="bg-zinc-700 w-full shadow-lg h-24 rounded-2xl flex flex-col items-center">
                                <div className="w-full bg-[#232325] shadow-lg h-16  rounded-t-xl">
                                    <p className="text-base text-white font-light font-poppins mt-1 ml-2">Sales</p>
                                    <h1 className="text-white mb-1 text-2xl font-medium font-poppins ml-2">₹ {MonthSale ? MonthSale.toLocaleString() : <spam className="text-sm text-center"><ClipLoader color='white' size={15} /> </spam>}</h1>
                                </div>
                                <div className="w-11/12 mt-1 ml-">
                                    <p className="font-medium mt-1 text-white font-poppins text-xs">Last 30 Day's</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="gap-10 m-10 sm:flex sm:justify-center sm:items-center">

                    <div className="sm:w-2/4 sm:mt-4 bg-[#232325] shadow-lg rounded-3xl">
                        <h1 className="text-center font-medium text-white font-poppins sm:mt-4">Last 30 Day's Profit</h1>
                        <div className=" mr-3">
                            <ProfitChart />
                        </div>
                    </div>

                    <div className="sm:w-1/5 w-5/6 m-6">
                        <div className="h-full">
                            <div className="bg-zinc-700  shadow-lg w-full h-24 rounded-2xl flex flex-col items-center">
                                <div className="w-full bg-[#232325] shadow-lg h-16  rounded-t-xl">
                                    <p className="text-base text-white font-light font-poppins mt-1 ml-2">Profit</p>
                                    <h1 className="text-white mb-1 text-2xl font-medium font-poppins ml-2">
                                        ₹ {todayProfit ? todayProfit.toLocaleString() : <spam className="text-sm text-center"><ClipLoader color='white' size={15} /> </spam>}</h1>
                                </div>
                                <div className="w-11/12 mt-1 ml-">
                                    <p className="font-medium mt-1 text-white font-poppins text-xs">Today's</p>
                                </div>
                            </div>
                        </div>
                        <div className="h-full mt-10">
                            <div className="bg-zinc-700  shadow-lg w-full h-24 rounded-2xl flex flex-col items-center">
                                <div className="w-full bg-[#232325] shadow-lg h-16  rounded-t-xl">
                                    <p className="text-base font-light text-white font-poppins mt-1 ml-2">Profit</p>
                                    <h1 className="text-white mb-1 text-2xl font-medium font-poppins ml-2">
                                        ₹ {monthProfit ? monthProfit.toLocaleString() : <spam className="text-sm text-center"><ClipLoader color='white' size={15} /> </spam>}</h1>
                                </div>
                                <div className="w-11/12 mt-1 ml-">
                                    <p className="font-medium mt-1 text-white font-poppins text-xs">Last 30 Day's</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="gap-10 m-10 sm:flex sm:justify-center sm:items-center">

                    <div className="sm:w-2/4 sm:mt-4 bg-[#232325] shadow-lg rounded-3xl">
                        <h1 className="text-center font-medium text-white font-poppins sm:mt-4">Inventory</h1>
                        <div className=" mr-3">
                            <InventoryChart />
                        </div>
                    </div>

                    <div className="sm:w-1/5 w-5/6 m-6">
                        <div className="w-full flex gap-4">
                            <div className="w-2/4 bg-zinc-800 rounded-3xl text-center shadow-md">
                                <p className="font-poppins text-white font-normal m-2 text-xs">Orders</p>
                                <h1 className="font-poppins text-white font-semibold text-xl m-2">{orders ? orders : <spam className="text-sm text-center"><ClipLoader color='white' size={15} /> </spam>}</h1>
                            </div>
                            <div className="w-2/4 bg-zinc-800 rounded-3xl text-center shadow-md">
                                <p className="font-poppins text-white font-normal m-2 text-xs">Pending Orders</p>
                                <h1 className="font-poppins font-semibold text-white text-xl m-2">{pendingOrders ? pendingOrders : <spam className="text-sm text-center"><ClipLoader color='white' size={15} /> </spam>}</h1>
                            </div>
                        </div>
                        <div className="w-full flex gap-4 mt-4">
                            <div className="w-2/4 bg-zinc-800 rounded-3xl text-center shadow-md">
                                <p className="font-poppins text-white font-normal m-2 text-xs">Total Invoices</p>
                                <h1 className="font-poppins text-white font-semibold text-xl m-2">{invoices ? invoices : <spam className="text-sm text-center"><ClipLoader color='white' size={15} /> </spam>}</h1>
                            </div>
                            <div className="w-2/4 bg-zinc-800 rounded-3xl text-center shadow-md">
                                <p className="font-poppins text-white font-normal m-2 text-xs">Unpaid Invoices</p>
                                <h1 className="font-poppins text-white font-semibold text-md m-2">
                                    ₹ {unpaidInvoices ? unpaidInvoices.toLocaleString() : <spam className="text-sm text-center"><ClipLoader color='white' size={15} /> </spam>}
                                </h1>
                            </div>
                        </div>
                        <div className="w-full flex justify-center gap-4 mt-4 h-24">
                            <div className="w-2/4 bg-zinc-800 rounded-3xl text-center shadow-md">
                                <p className="font-poppins text-white font-normal m-2 text-xs">Active Customers</p>
                                <h1 className="font-poppins font-semibold text-white text-xl m-2">{customers}</h1>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="gap-10 m-10 sm:flex sm:justify-center sm:items-center">

                    <div className="sm:w-2/4 sm:mt-4 bg-[#232325] shadow-lg rounded-3xl">
                        <h1 className="text-center font-medium text-sm text-white mb-3 font-poppins mt-4">Sales v/s Profit v/s Cost v/s Expenses</h1>
                        <div className="m-5 mr-3">
                            <FinancialChart />
                        </div>
                    </div>

                    <div className="sm:w-1/4 sm:mt-4 bg-[#232325] shadow-lg rounded-3xl">
                        <h1 className="text-center font-medium text-sm text-white font-poppins mt-4">Financial Distribution</h1>
                        <div className=" mr-3">
                            <FinancialDist />
                        </div>
                    </div>

                </div>

            </div>
        </Layout>
    );
}

export default Dashboard;