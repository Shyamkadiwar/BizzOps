import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import * as XLSX from "xlsx";

function InventoryTable({ inventoryItems, onUpdateInventory }) {
    const [newQty, setNewQty] = useState(0);
    const [action, setAction] = useState("");
    const [product, setProduct] = useState("");
    const [localInventory, setLocalInventory] = useState(inventoryItems);
    const [isPopupVisible, setPopupVisible] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState(null);

    useEffect(() => {
        setLocalInventory(inventoryItems);
    }, [inventoryItems]);

    const deleteInventory = async (itemId) => {
        try {
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/inventory/delete-item`, { product: itemId }, { withCredentials: true });
            if (response.status === 200) {
                console.log("Deleted");
                setLocalInventory((prevItems) => prevItems.filter(item => item._id !== itemId));
                handleClosePopup(); // Close the popup after deletion
            }
        } catch (error) {
            console.error("Error deleting inventory item:", error);
        }
    };

    const handleStockClick = (itemId, actionType) => {
        setProduct(itemId);
        setNewQty(0);
        setAction(actionType);
    };

    const handleClosePopup = () => {
        setNewQty(0);
        setProduct("");
        setAction("");
        setPopupVisible(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onUpdateInventory(action, product, parseInt(newQty));

        // Updating local state immediately for responsive UI
        setLocalInventory((prevItems) =>
            prevItems.map(item =>
                item._id === product
                    ? {
                        ...item,
                        stockRemain: action === "add"
                            ? Number(item.stockRemain) + Number(newQty)
                            : Number(item.stockRemain) - Number(newQty)
                    }
                    : item
            )
        );

        handleClosePopup();
    };

    const confirmDelete = (itemId) => {
        setDeleteItemId(itemId);
        setPopupVisible(true);
    };

    const handleDelete = () => {
        if (deleteItemId) {
            deleteInventory(deleteItemId);
        }
    };

    const fetchAndDownload = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/inventory/get-item`, { withCredentials: true });
            const inventoryData = response.data.data;

            if (!inventoryData || inventoryData.length === 0) {
                alert("No data to download");
                return;
            }

            // Transform data if necessary
            const formattedData = inventoryData.map(item => ({
                Item: item.item,
                Category: item.category,
                StockRemaining: item.stockRemain,
                Date: new Date(item.date).toLocaleDateString(),
                LastModified: new Date(item.updatedAt).toLocaleString(),
            }));

            // Convert data to Excel
            const worksheet = XLSX.utils.json_to_sheet(formattedData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");

            // Export Excel file
            XLSX.writeFile(workbook, "Inventory.xlsx");
        } catch (error) {
            console.error("Error fetching or downloading inventory data:", error);
            alert("Failed to download the file.");
        }
    };

    return (
        <>
            <div className="w-full bg-[#28282B] shadow-md rounded-lg p-6">
                <div className="flex gap-10 h-20 items-center">
                    <h2 className="text-base font-poppins font-semibold mb-4 text-white">Inventory Records</h2>
                    <button
                        onClick={fetchAndDownload}
                        className="bg-white h-1/2 text-black py-2 px-4 rounded-xl"
                    >
                        Download
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full ">
                        <thead>
                            <tr className="bg-zinc-900">
                                <th className="px-4 py-2 text-white font-poppins">Item</th>
                                <th className="px-4 py-2 text-white font-poppins">Category</th>
                                <th className="px-4 py-2 text-white font-poppins">Vendor</th>
                                <th className="px-4 py-2 text-white font-poppins">Stock In</th>
                                <th className="px-6 py-4 text-white font-poppins">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {localInventory.length > 0 ? (
                                localInventory.map((inventory) => (
                                    <tr key={inventory._id} className="text-center">
                                        <td className="px-4 py-6 sm:py-3 text-white text-sm font-medium font-poppins">{inventory.item}</td>
                                        <td className="px-4 py-6 sm:py-3 text-white text-sm font-medium font-poppins">{inventory.category}</td>
                                        <td className="px-4 py-6 sm:py-3 text-white text-sm font-medium font-poppins">
                                            {inventory.vendor?.name || inventory.vendorName || 'N/A'}
                                        </td>
                                        <td className="px-4 py-6 sm:py-3 text-white text-sm font-poppins font-bold">
                                            {inventory.stockRemain || 'N/A'}
                                        </td>
                                        <td className="text-center">
                                            <button
                                                onClick={() => handleStockClick(inventory._id, "add")}
                                                className="bg-white text-black sm:text-xs text-[14px] font-poppins font-medium sm:text-center sm:w-1/12 w-6 h-6 sm:h-6 rounded hover:bg-blue-100 mr-2"
                                            >
                                                <FontAwesomeIcon icon={faPlus} />
                                            </button>
                                            <button
                                                onClick={() => handleStockClick(inventory._id, "remove")}
                                                className="bg-white text-black sm:text-xs text-[14px] font-poppins font-medium sm:text-center sm:w-1/12 w-6 h-6 sm:h-6 rounded hover:bg-blue-100 mr-2"
                                            >
                                                <FontAwesomeIcon icon={faMinus} />
                                            </button>
                                            <button
                                                onClick={() => confirmDelete(inventory._id)}
                                                className="bg-white text-black sm:text-xs text-[14px] font-poppins font-medium sm:text-center sm:w-1/12 w-6 h-6 sm:h-6 rounded hover:bg-blue-100 mr-2"
                                            >
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center">No inventory items found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {action && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                    <div className="bg-[#28282B] font-poppins p-6 sm:w-1/4 rounded-2xl shadow-lg">
                        <h2 className="text-lg text-white font-poppins font-medium mb-4">
                            {action === "add" ? "+ Add Stock" : "- Remove Stock"}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <input
                                type="text"
                                value={newQty}
                                onChange={(e) => setNewQty(e.target.value)}
                                min="1"
                                placeholder="Quantity"
                                required
                                className="rounded-2xl shadow-xl bg-[#2b2b2e] p-2 mb-4 w-full text-white"
                            />
                            <div className="flex justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={handleClosePopup}
                                    className="text-white font-poppins font-semibold rounded-2xl mr-2"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="text-blue-400 hover:text-blue-300 font-poppins font-semibold rounded-2xl"
                                >
                                    Submit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isPopupVisible && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                    <div className="bg-[#28282B] font-poppins p-6 sm:w-1/4 w-4/5 rounded-2xl shadow-lg">
                        <h2 className="text-lg font-poppins font-medium mb-4 text-white">Confirm Deletion</h2>
                        <p className="font-poppins text-white">Are you sure you want to delete this item?</p>
                        <div className="flex justify-end mt-4 gap-4">
                            <button
                                type="button"
                                onClick={handleClosePopup}
                                className="text-blue-500 hover:text-blue-300 rounded-2xl font-poppins font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="text-red-500 hover:text-red-300 font-poppins font-semibold rounded-2xl"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default InventoryTable;
