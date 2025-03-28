import  { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AddInventory from "./AddInventory.jsx";
import InventoryTable from "./InventoryTable.jsx";
import Sidebar from "../Sidebar.jsx";
import CustomBtn from "../CustomBtn.jsx";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Account from "../Account.jsx";
const token = localStorage.getItem('accessToken');

function Inventory() {
    const navigate = useNavigate()
    const [inventoryItems, setInventoryItems] = useState([]);
    const [updateTrigger, setUpdateTrigger] = useState(0);
    const isMounted = useRef(true);

    const fetchInventory = useCallback(async () => {
        if (!isMounted.current) return;
        try {
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/inventory/get-item`, { headers:{'Authorization':token},withCredentials: true });
            if (response.status === 200 && response.data && response.data.data) {
                setInventoryItems(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
        }
    }, []);

    useEffect(() => {
        fetchInventory();
        return () => {
            isMounted.current = false;
        };
    }, [fetchInventory, updateTrigger]);

    const handleItemAdded = (newItem) => {
        setInventoryItems((prevItems) => [...prevItems, newItem]);
        setUpdateTrigger(prev => prev + 1);
    };

    const updateInventory = async (action, productId, quantity) => {
        try {
            const endpoint = action === "add"
                ? `${import.meta.env.VITE_BACKEND_URL}/api/v1/inventory/add-stock`
                : `${import.meta.env.VITE_BACKEND_URL}/api/v1/inventory/remove-stock`;

            const response = await axios.post(
                endpoint,
                { product: productId, newQty: quantity },
                { headers:{'Authorization':token},withCredentials: true }
            );

            if (response.data.message === 200) {
                console.log(`Stock ${action}ed:`, { productId, quantity });
                // Trigger a re-fetch of the inventory
                setUpdateTrigger(prev => prev + 1);
            }
        } catch (error) {
            console.error(`Error ${action}ing stock:`, error);
        }
    };

    return (
        <>
            <div className="flex min-h-screen">
                <Sidebar />
                <div id="infoCards" className="overflow-y-auto h-[calc(100vh)] sm:w-5/6 bg-[#141415]">
                    <CustomBtn />
                    <Account />
                    <h1 className="sm:m-10 m-4 mt-20 text-2xl font-medium font-poppins flex items-center text-white"> <FontAwesomeIcon icon={faArrowLeft} className="text-md pr-2" onClick={()=> navigate('/dashboard')} /> Inventory</h1>
                    <div className="justify-center items-center flex flex-col">
                        <div className="w-5/6 bg-[#28282B] rounded-xl gap-4 mb-4">
                            <h1 className=" ml-4 mt-2 font-semibold text-white font-poppins">Add Item</h1>
                            <AddInventory onItemAdded={handleItemAdded} />
                        </div>

                        <div className="mt-2 m-9 w-5/6 flex justify-center items-center gap-4">
                            <InventoryTable inventoryItems={inventoryItems} onUpdateInventory={updateInventory} />
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}

export default Inventory;