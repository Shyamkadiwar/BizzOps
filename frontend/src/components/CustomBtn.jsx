import React from "react";
import { useNavigate } from "react-router-dom";

function CustomBtn(){

    const navigate = useNavigate()

    return(
        <>
            <div className="absolute sm:top-5 sm:right-24 top-6 right-16">
                <button className="sm:text-sm text-xs bg-gradient-to-r from-blue-300 to-indigo-300 text-gray-700-400 font-normal font-poppins px-6 py-3 rounded-full hover:bg-gradient-to-bl transition" onClick={()=>{navigate("/Customizes")}}>Customize App</button>
            </div>
        </>
        
    )
}

export default CustomBtn