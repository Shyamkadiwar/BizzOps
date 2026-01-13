import { useEffect, useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
const InventoryChart = () => {
  const [inventoryData, setInventoryData] = useState([]);
  const [error, setError] = useState("");

  const fetchInventoryData = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/inventory/get-item?limit=100`, { withCredentials: true });

      if (response.status === 200) {
        // Handle new paginated response structure
        const items = response.data.data.inventoryItems || response.data.data || [];
        setInventoryData(items);
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
