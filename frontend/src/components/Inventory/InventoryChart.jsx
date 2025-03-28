import  { useEffect, useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
const token = localStorage.getItem('accessToken')
const InventoryChart = () => {
  const [inventoryData, setInventoryData] = useState([]);
  const [error, setError] = useState("");

  const fetchInventoryData = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken"); 

      if (!accessToken) {
        throw new Error("Access token not found. Please login again.");
      }

      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/inventory/get-item`, { headers:{'Authorization':token},withCredentials: true });

      if (response.status === 200) {
        setInventoryData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching inventory data:", error.message);
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const chartData = {
    labels: inventoryData.map((item) => item.item),
    datasets: [
      {
        label: "Stock Remaining",
        data: inventoryData.map((item) => item.stockRemain), 
        backgroundColor: "rgba(86, 248, 209, 1)", 
        borderColor: "rgba(86, 248, 209, 1)",
        borderWidth: 1,
      },
    ],
  };

  return (
    <div>
      {error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <Bar
          height={10}
          width={15}
          data={chartData}
          options={{
            responsive: true,
            scales: {
              x: {
                title: {
                  display: true,
                  text: "Items",
                  font: {
                    family: "Helvetica",
                    size: 10,
                    style: "normal",
                    weight: "normal",
                  },
                  color: "#ffffff",
                },
                grid: {
                  display: false,
                },
                ticks: {
                  display: true,
                },
              },
              y: {
                title: {
                  display: true,
                  text: "Stock Remaining",
                  font: {
                    family: "Helvetica",
                    size: 10,
                    style: "normal",
                    weight: "normal",
                  },
                  color: "#ffffff",
                },
                grid: {
                  display: false,
                },
                ticks: {
                  display: true,
                },
              },
            },
            plugins: {
              legend: {
                display: false,
              },
            },
          }}
        />
      )}
    </div>
  );
};

export default InventoryChart;
