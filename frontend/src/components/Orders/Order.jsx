import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from '../Layout.jsx';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faBackward } from "@fortawesome/free-solid-svg-icons";
import AddOrders from "./AddOrders.jsx";
import OrderTable from "./OrderTable.jsx";
import OrderRAGComponent from "./OrderRAGComponent.jsx";

function Orders() {
    const navigate = useNavigate();

    return (
        <>
            <OrderRAGComponent />
            <Layout>
                <div id="infoCards" className="overflow-y-auto bg-[#141415] p-4">
                    <h1 className="sm:m-10 m-4 text-2xl font-medium font-poppins flex items-center text-white"> <FontAwesomeIcon icon={faArrowLeft} className="text-md pr-2" onClick={() => navigate('/dashboard')} /> Orders</h1>
                    <div className="justify-center items-center flex flex-col">
                        <div className="w-5/6 bg-[#28282B] rounded-xl">
                            <AddOrders />
                        </div>
                        <div className="m-5 w-5/6">
                            <OrderTable />
                        </div>
                    </div>
                </div>
            </Layout>
        </>
    );
}

export default Orders;