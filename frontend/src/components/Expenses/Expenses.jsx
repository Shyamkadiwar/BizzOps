import { useNavigate } from "react-router-dom";
import AddExpense from "./AddExpense.jsx";
import ExpenseTable from "./ExpenseTable.jsx";
import Layout from '../Layout.jsx';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faBackward } from "@fortawesome/free-solid-svg-icons";
import ExpenseRAGComponent from "./ExpenseRAGComponent.jsx";

function Expense() {
    const navigate = useNavigate()

    return (
        <>
            <ExpenseRAGComponent />
            <Layout>
                <div id="infoCards" className="overflow-y-auto bg-[#141415] p-4">
                    <h1 className="sm:m-10 m-4 text-2xl font-medium font-poppins flex items-center text-white "> <FontAwesomeIcon icon={faArrowLeft} className="text-md pr-2" onClick={() => navigate('/dashboard')} /> Expense</h1>
                    <div className="justify-center items-center flex flex-col">
                        <div className="w-5/6 bg-[#28282B] rounded-xl">
                            <h1 className="ml-4 mt-2 font-semibold text-white font-poppins">Add Expense</h1>
                            <AddExpense />
                        </div>
                        <div className="m-5 w-5/6">
                            <ExpenseTable />
                        </div>
                    </div>
                </div>
            </Layout>
        </>
    );
}

export default Expense;