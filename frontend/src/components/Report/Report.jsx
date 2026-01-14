import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import Layout from "../Layout";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Report() {
    const navigate = useNavigate()
    const [totalSale, setTotalSales] = useState(0)
    const [todaySale, setTodaySales] = useState(0)
    const [MonthSale, setMonthSales] = useState(0)
    const [totalProfit, setTotalProfit] = useState(0)
    const [todayProfit, setTodayProfit] = useState(0)
    const [monthProfit, setMonthProfit] = useState(0)
    const [totalCost, setTotalCost] = useState(0)
    const [totalNetIncome, setTotalNetIncome] = useState(0)
    const [totalExpense, setTotalExpense] = useState(0)
    const [monthExpense, setMonthTotalExpense] = useState(0)
    const [oneDayExpense, setOneDayExpense] = useState(0)
    const [orders, setOrders] = useState(0)
    const [pendingOrders, setPendingOrders] = useState(0)
    const [invoices, setInvoices] = useState(0)
    const [unpaidInvoices, setUnpaidInvoices] = useState(0)
    const [customers, setCustomers] = useState(0)

    const fetchData = async () => {
        try {
            const totalSaleResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/sales/get-total-alltime-sale`, { withCredentials: true })
            const monthSaleResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/sales/get-total-last30Day-sale`, { withCredentials: true })
            const todaySaleResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/sales/get-total-oneday-sale`, { withCredentials: true })
            const monthProfitResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/sales/get-total-last30Day-profit`, { withCredentials: true })
            const totalProfitResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/sales/get-total-alltime-profit`, { withCredentials: true })
            const todayProfitResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/sales/get-total-one-profit`, { withCredentials: true })
            const totalCostResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/sales/get-total-alltime-cost`, { withCredentials: true })
            const totalExpenseResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/expense/get-alltime-expense`, { withCredentials: true })
            const monthExpenseResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/expense/get-last30day-expense`, { withCredentials: true })
            const oneExpenseResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/expense/get-oneday-expense`, { withCredentials: true })
            const orderResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/orders/count-order`, { withCredentials: true })
            const pendingOrderResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/orders/get-pending-order`, { withCredentials: true })
            const invoicesResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/invoice/count-invoice`, { withCredentials: true })
            const unpaidInvoicesResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/invoice/unpaid-invoice`, { withCredentials: true })
            const customersResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/customer/count-customer`, { withCredentials: true })

            setTotalSales(totalSaleResponse.data.data.totalSalesValue)
            setMonthSales(monthSaleResponse.data.data.totalSalesValue)
            setTodaySales(todaySaleResponse.data.data.totalSalesValue)
            setTotalProfit(totalProfitResponse.data.data.totalProfitValue)
            setMonthProfit(monthProfitResponse.data.data.totalProfitValue)
            setTodayProfit(todayProfitResponse.data.data.totalProfitValue)
            setTotalCost(totalCostResponse.data.data.totalCostValue)
            setTotalExpense(totalExpenseResponse.data.data.totalExpenseValue)
            setMonthTotalExpense(monthExpenseResponse.data.data.totalExpenseValue)
            setOneDayExpense(oneExpenseResponse.data.data.totalExpenseValue)
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

    const [grossProfitMargin, setGrossProfitMargin] = useState(0);
    const [netProfitMargin, setNetProfitMargin] = useState(0);
    const [avgSalePerOrder, setAvgSalePerOrder] = useState(0);
    const [profitPerOrder, setProfitPerOrder] = useState(0);
    const [expenseRatio, setExpenseRatio] = useState(0);
    const [returnOnSale, setReturnOnSale] = useState(null)
    const [pendingInvoiceRatio, setPendingInvoiceRatio] = useState(0);

    const [monthlyGrossProfitMargin, setMonthlyGrossProfitMargin] = useState(0);
    const [monthlyNetProfitMargin, setMonthlyNetProfitMargin] = useState(0);
    const [monthlyAvgSalePerOrder, setMonthlyAvgSalePerOrder] = useState(0);
    const [monthlyProfitPerOrder, setMonthlyProfitPerOrder] = useState(0);
    const [monthlyExpenseRatio, setMonthlyExpenseRatio] = useState(0);

    const [dailyGrossProfitMargin, setDailyGrossProfitMargin] = useState(0);
    const [dailyNetProfitMargin, setDailyNetProfitMargin] = useState(0);
    const [dailyAvgSalePerOrder, setDailyAvgSalePerOrder] = useState(0);
    const [dailyProfitPerOrder, setDailyProfitPerOrder] = useState(0);
    const [dailyExpenseRatio, setDailyExpenseRatio] = useState(0);

    useEffect(() => {
        if (totalSale > 0) {
            setGrossProfitMargin((totalProfit / totalSale) * 100);
            setNetProfitMargin((totalNetIncome / totalSale) * 100);
            setAvgSalePerOrder(totalSale / orders);
            setProfitPerOrder(totalProfit / orders);
            setExpenseRatio((totalExpense / totalSale) * 100);
            setPendingInvoiceRatio((unpaidInvoices / invoices) * 100);
            setReturnOnSale((totalNetIncome / todaySale) * 100)
        }
    }, [totalSale, totalProfit, totalNetIncome, totalExpense, orders, invoices, unpaidInvoices]);

    useEffect(() => {
        if (MonthSale > 0) {
            setMonthlyGrossProfitMargin((monthProfit / MonthSale) * 100);
            setMonthlyNetProfitMargin((monthProfit - monthExpense) / MonthSale * 100);
            setMonthlyAvgSalePerOrder(MonthSale / orders);
            setMonthlyProfitPerOrder(monthProfit / orders);
            setMonthlyExpenseRatio((totalExpense / MonthSale) * 100);
        }
    }, [MonthSale, monthProfit, totalExpense, orders]);

    useEffect(() => {
        if (todaySale > 0) {
            setDailyGrossProfitMargin((todayProfit / todaySale) * 100);
            setDailyNetProfitMargin((todayProfit - totalExpense) / todaySale * 100);
            setDailyAvgSalePerOrder(todaySale / orders);
            setDailyProfitPerOrder(todayProfit / orders);
            setDailyExpenseRatio((totalExpense / todaySale) * 100);
        }
    }, [todaySale, todayProfit, totalExpense, orders]);

    return (
        <Layout>
            <div id="infoCards" className="overflow-y-auto bg-[#141415] p-4">
                <h1 className="sm:m-10 m-4 text-2xl font-medium font-poppins flex items-center text-white">
                    <FontAwesomeIcon icon={faArrowLeft} className="text-md pr-2 cursor-pointer" onClick={() => navigate('/dashboard')} /> Report
                </h1>
                <div className="justify-center items-center flex flex-col">
                    <div className="m-3 lg:m-5 w-11/12 lg:w-5/6 bg-[#28282B] rounded-xl p-4">
                        <h1 className="text-base mt-3 lg:mt-5 font-medium font-poppins text-white text-center">All Time Report</h1>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 m-4">
                            <InputField label="Total Sale" value={totalSale} />
                            <InputField label="Total Profit" value={totalProfit.toFixed(2)} />
                            <InputField label="Total Cost" value={totalCost.toFixed(2)} />
                            <InputField label="Gross Profit Margin" value={grossProfitMargin.toFixed(0)} />
                            <InputField label="Net Profit Margin" value={netProfitMargin.toFixed(2)} />
                            <InputField label="Avg Sale per Order" value={avgSalePerOrder.toFixed(2)} />
                            <InputField label="Profit per Order" value={profitPerOrder.toFixed(0)} />
                            <InputField label="Expense Ratio" value={expenseRatio.toFixed(2)} />
                            <InputField label="Total Expense" value={totalExpense.toFixed(2)} />
                            <InputField label="Total Net Income" value={(totalProfit - totalExpense).toFixed(0)} />
                            <InputField label="Unpaid Invoices" value={unpaidInvoices.toFixed(0)} />
                            <InputField label="Return On Sale" value={returnOnSale !== null ? returnOnSale.toFixed(2) : 'Loading...'} />
                        </div>
                    </div>

                    <div className="m-3 lg:m-5 w-11/12 lg:w-5/6 bg-[#28282B] rounded-xl p-4">
                        <h1 className="text-base mt-3 lg:mt-5 font-medium font-poppins text-center text-white">Month Report</h1>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 m-4">
                            <InputField label="Month Sale" value={MonthSale} />
                            <InputField label="Month Profit" value={monthProfit.toFixed(2)} />
                            <InputField label="Month Expense" value={monthExpense} />
                            <InputField label="Gross Profit Margin" value={monthlyGrossProfitMargin.toFixed(0)} />
                            <InputField label="Net Profit Margin" value={monthlyNetProfitMargin.toFixed(2)} />
                            <InputField label="Avg Sale per Order" value={monthlyAvgSalePerOrder.toFixed(2)} />
                            <InputField label="Profit per Order" value={monthlyProfitPerOrder.toFixed(0)} />
                            <InputField label="Expense Ratio" value={monthlyExpenseRatio.toFixed(2)} />
                            <InputField label="Month Net Income" value={(monthProfit - monthExpense).toFixed(2)} />
                        </div>
                    </div>

                    <div className="m-3 lg:m-5 w-11/12 lg:w-5/6 bg-[#28282B] rounded-xl p-4">
                        <h1 className="text-base mt-3 lg:mt-5 font-medium font-poppins text-center text-white">Daily Report</h1>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 m-4">
                            <InputField label="Daily Sale" value={todaySale} />
                            <InputField label="Daily Profit" value={todayProfit.toFixed(2)} />
                            <InputField label="Daily Expense" value={oneDayExpense} />
                            <InputField label="Gross Profit Margin" value={dailyGrossProfitMargin.toFixed(0)} />
                            <InputField label="Net Profit Margin" value={dailyNetProfitMargin.toFixed(2)} />
                            <InputField label="Avg Sale per Order" value={dailyAvgSalePerOrder.toFixed(2)} />
                            <InputField label="Profit per Order" value={dailyProfitPerOrder.toFixed(0)} />
                            <InputField label="Expense Ratio" value={dailyExpenseRatio.toFixed(2)} />
                            <InputField label="Daily Net Income" value={(todayProfit - oneDayExpense).toFixed(2)} />
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}

const InputField = ({ label, value }) => (
    <div className="flex flex-row sm:gap-10 gap-6 items-center m-4">
        <label className="mb-2 font-poppins font-medium text-white">{label}</label>
        <input
            type="text"
            value={value}
            readOnly
            className="sm:w-1/3 w-1/2 text-center h-10 rounded-2xl bg-gray-200 font-poppins font-medium hover:border-black hover:border-2"
        />
    </div>
)

export default Report