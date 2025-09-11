import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

const AddInvoice = () => {
    const navigate = useNavigate();
    const [customer, setCustomer] = useState('');
    const [items, setItems] = useState([{ itemName: '', qty: '', price: '', tax: '', availableStock: 0 }]);
    const [paid, setPaid] = useState(false);
    const [date, setDate] = useState('');
    const [subTotal, setSubTotal] = useState(0);
    const [grandTotal, setGrandTotal] = useState(0);
    const [isPopupVisible, setPopupVisible] = useState(false);
    const [inventoryItems, setInventoryItems] = useState([]);

    // Fetch inventory items when component mounts
    useEffect(() => {
        const fetchInventoryItems = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/inventory/get-item`, { withCredentials: true });
                
                setInventoryItems(response.data.data);
            } catch (error) {
                console.error('Error fetching inventory:', error);
            }
        };

        fetchInventoryItems();
    }, []);

    const calculateTotals = (updatedItems) => {
        const newSubTotal = updatedItems.reduce((acc, item) => acc + (item.qty * item.price || 0), 0);
        const newGrandTotal = updatedItems.reduce((acc, item) => {
            const itemTotal = (item.qty * item.price || 0);
            const taxAmount = itemTotal * (item.tax / 100 || 0);
            return acc + itemTotal + taxAmount;
        }, 0);
        setSubTotal(newSubTotal);
        setGrandTotal(newGrandTotal);
    };

    const handleItemChange = (index, field, value) => {
        const updatedItems = [...items];
        updatedItems[index] = { ...updatedItems[index], [field]: value };

        // If changing item name, update available stock
        if (field === 'itemName') {
            const selectedInventoryItem = inventoryItems.find(inv => inv.item === value);
            updatedItems[index].availableStock = selectedInventoryItem ? selectedInventoryItem.stockRemain : 0;
        }

        // Validate quantity against available stock
        if (field === 'qty') {
            const availableStock = updatedItems[index].availableStock || 0;
            if (Number(value) > availableStock) {
                alert(`Only ${availableStock} items available in stock`);
                updatedItems[index].qty = availableStock.toString();
            }
        }

        setItems(updatedItems);
        calculateTotals(updatedItems);
    };

    const addMoreItem = () => {
        setItems([...items, { itemName: '', qty: '', price: '', tax: '', availableStock: 0 }]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const invoiceData = {
                name: customer,
                items: items.map(item => ({
                    itemName: item.itemName,
                    qty: Number(item.qty),
                    price: Number(item.price),
                    tax: Number(item.tax)
                })),
                paid,
                date
            };
            console.log(invoiceData);
            

            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/invoice/add-invoice`, 
                invoiceData, 
                {
                    withCredentials: true 
                }
            );

            if (response.status === 200) {   
                setPopupVisible(true);
                // Reset form
                setCustomer('');
                setItems([{ itemName: '', qty: '', price: '', tax: '', availableStock: 0 }]);
                setPaid(false);
                setDate('');
                setSubTotal(0);
                setGrandTotal(0);
            }
        } catch (error) {
            console.error('Error adding invoice:', error);
            alert(error.response?.data?.message || 'Failed to add invoice');
        }
    };

    const handleClosePopup = () => {
        setPopupVisible(false);
        window.location.reload();
    };

    return (
        <div className="justify-center items-center flex m-4 rounded-2xl flex-col bg-[#28282B]">
            <h2 className='mb-2 font-poppins font-semibold text-white'>New Invoice</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Customer"
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    required
                    className="sm:w-1/4 w-4/5 text-center h-10 m-3 rounded-2xl bg-[#2b2b2e] shadow-xl font-poppins font-normal text-white"
                />
                <input
                    type='date'
                    value={date}
                    onChange={(e) => { setDate(e.target.value) }}
                    className="sm:w-1/4 w-4/5 text-center h-10 m-3 rounded-2xl pr-4 bg-[#2b2b2e] shadow-xl font-poppins font-normal text-white"
                />
                {items.map((item, index) => (
                    <div key={index} className="flex items-center">
                        <select
                            value={item.itemName}
                            onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                            required
                            className="sm:w-1/5 w-2/4 text-center h-10 m-3 rounded-2xl bg-[#2b2b2e] shadow-xl font-poppins font-normal text-white"
                        >
                            <option value="">Select Item</option>
                            {inventoryItems.map((invItem) => (
                                <option 
                                    key={invItem._id} 
                                    value={invItem.item}
                                >
                                    {invItem.item} (Stock: {invItem.stockRemain})
                                </option>
                            ))}
                        </select>
                        <input
                            type="number"
                            placeholder="Qty"
                            value={item.qty}
                            onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                            required
                            min="1"
                            max={item.availableStock}
                            className="sm:w-1/5 w-2/6 text-center h-10 m-3 rounded-2xl bg-[#2b2b2e] shadow-xl font-poppins font-normal text-white"
                        />
                        <input
                            type="number"
                            placeholder="Price"
                            value={item.price}
                            onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                            required
                            min="1"
                            className="sm:w-1/5 w-3/6 text-center h-10 m-3 rounded-2xl bg-[#2b2b2e] shadow-xl font-poppins font-normal text-white"
                        />
                        <input
                            type="number"
                            placeholder="Tax %"
                            value={item.tax}
                            onChange={(e) => handleItemChange(index, 'tax', e.target.value)}
                            required
                            min="0"
                            className="sm:w-1/12 w-2/6 text-center h-10 m-3 pl-4 rounded-2xl bg-[#2b2b2e] shadow-xl font-poppins font-normal text-white"
                        />
                    </div>
                ))}
                <div className='sm:w-2/4 flex'>
                    <div className="w-20 flex justify-start items-center text-center h-10 m-3 pl-4 rounded-xl bg-[#2b2b2e] shadow-xl font-poppins font-normal">
                        <input
                            type="checkbox"
                            className="w-3 h-3"
                            checked={paid}
                            onChange={(e) => setPaid(e.target.checked)}
                        />
                        <label className='pl-1 text-sm text-white font-poppins font-normal'>Paid</label>
                    </div>
                    <div>
                        <button
                            type="button"
                            onClick={addMoreItem}
                            className="bg-white w-40 h-10 text-center text-sm m-3 font-poppins flex justify-center items-center rounded-xl hover:bg-blue-100 hover:text-black">
                            <FontAwesomeIcon icon={faPlus} className="text-xs pr-1" /> Add More Item
                        </button>
                    </div>
                </div>

                <div className='sm:w-3/4 sm:flex'>
                    <label htmlFor="" className='m-4 font-poppins text-white'>Sub Total</label>
                    <input type="text" readOnly value={subTotal} className="sm:w-1/5 w-2/5 text-center sm:h-10 h-10 m-3 rounded-2xl border-white border-[1px] bg-[#28282B] text-white font-poppins font-normal" />
                    <label htmlFor="" className='m-4 font-poppins text-white'>Grand Total</label>
                    <input type="text" readOnly value={grandTotal} className="sm:w-1/5 w-2/5 text-center sm:h-10 h-10 m-3 rounded-2xl border-white border-[1px] bg-[#28282B] text-white font-poppins font-normal" />
                </div>

                <button
                    type="submit"
                    className="bg-white sm:w-1/6 h-10 w-2/5 text-center text-sm m-2 font-poppins flex justify-center items-center rounded-xl hover:bg-blue-100 hover:text-black">
                    <FontAwesomeIcon icon={faPlus} className="text-xs pr-1" /> Add Invoice
                </button>
            </form>
            {isPopupVisible && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                    <div className="bg-[#28282B] rounded p-6 max-w-sm sm:w-full w-4/5">
                        <h2 className="text-lg font-poppins text-white font-bold">Success!</h2>
                        <p className="mt-2 font-poppins text-white">Invoice added successfully.</p>
                        <div className="mt-4 flex justify-end">
                            <button 
                                onClick={handleClosePopup} 
                                className="text-blue-400 font-semibold hover:text-blue-300 font-poppins"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        
    );
};

export default AddInvoice;