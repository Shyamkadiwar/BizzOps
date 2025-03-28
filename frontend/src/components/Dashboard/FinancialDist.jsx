import React, { useEffect, useState } from "react";
import axios from "axios";
import { Pie } from "react-chartjs-2";
import "chart.js/auto";

const token = localStorage.getItem('accessToken')

const FinancialDist = () => {
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const [profitResponse, costResponse, salesResponse] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/sales/get-daily-profit-30Day`, {headers:{'Authorization':token}, withCredentials: true }),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/sales/get-daily-cost-30Day`, { headers:{'Authorization':token},withCredentials: true }),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/sales/get-daily-sale-30Day`, { headers:{'Authorization':token},withCredentials: true }),
      ]);

      const totalProfit = Object.values(profitResponse.data.data).reduce((acc, val) => acc + val, 0);
      const totalCost = Object.values(costResponse.data.data).reduce((acc, val) => acc + val, 0);
      const totalSales = Object.values(salesResponse.data.data).reduce((acc, val) => acc + val, 0);

      setChartData({
        labels: ["Profit", "Cost", "Sales"],
        datasets: [
          {
            data: [totalProfit, totalCost, totalSales],
            backgroundColor: ["rgba(0, 254, 0, 1)", "rgba(254, 0, 0, 0.8)", "rgba(0, 35, 254, 0.8)"],
            hoverOffset: 4,
          },
        ],
      });
    } catch (error) {
      console.error("Error fetching data for pie chart:", error.message);
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="flex flex-col items-center p-4 rounded-lg ">
      {error ? (
        <div className="text-red-500 font-semibold">{error}</div>
      ) : (
        chartData && (
          <Pie
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  display: true,
                  position: "bottom",
                  labels: {
                    font: {
                      size: 10,
                      weight: 'normal',
                    },
                    color: '#ffffff',
                  },
                },
                tooltip: {
                  callbacks: {
                    label: function(tooltipItem) {
                      const label = tooltipItem.label || '';
                      const value = tooltipItem.raw || 0;
                      return `${label}: ${value}`;
                    },
                  },
                },
              },
            }}
          />
        )
      )}
    </div>
  );
};

export default FinancialDist;
