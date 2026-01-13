import Signup from "./pages/Signup.jsx";
import Signin from "./pages/Signin.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import InventoryPage from "./pages/InventoryPage.jsx";
import SalesPage from "./pages/SalesPage.jsx";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import InvoicePage from "./pages/InvoicePage.jsx";
import ExpensePage from "./pages/ExpensePage.jsx";
import ReportPage from "./pages/ReportPage.jsx";
import PaymentPage from "./pages/PaymentPage.jsx";
import ProtectedRoute from "./components/ProtectedRoutes.jsx";
import OrderPage from "./pages/OrderPage.jsx";
import CustomerPage from "./pages/CustomerPage.jsx";
import StaffPage from "./pages/SatffPage.jsx";
import Notes from "./components/Note/Note.jsx";
import Customizes from "./components/Customize/Customize.jsx";
import Demo from "./components/Demo.jsx";
import ProductPage from "./pages/ProductPage.jsx";
import VendorPage from "./pages/VendorPage.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Signin />} />
        <Route path="/register" element={<Signup />} />
        <Route path="/Customizes" element={<Customizes />} />
        <Route path="/demo" element={<Demo />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute element={<DashboardPage />} />} />
        <Route path="/inventory" element={<ProtectedRoute element={<InventoryPage />} />} />
        <Route path="/sales" element={<ProtectedRoute element={<SalesPage />} />} />
        <Route path="/product" element={<ProtectedRoute element={<ProductPage />} />} />
        <Route path="/Invoices" element={<ProtectedRoute element={<InvoicePage />} />} />
        <Route path="/Expenses" element={<ProtectedRoute element={<ExpensePage />} />} />
        <Route path="/Report" element={<ProtectedRoute element={<ReportPage />} />} />
        <Route path="/Payment" element={<ProtectedRoute element={<PaymentPage />} />} />
        <Route path="/Orders" element={<ProtectedRoute element={<OrderPage />} />} />
        <Route path="/Customer" element={<ProtectedRoute element={<CustomerPage />} />} />
        <Route path="/Vendor" element={<ProtectedRoute element={<VendorPage />} />} />
        <Route path="/Staff" element={<ProtectedRoute element={<StaffPage />} />} />
        <Route path="/Notes" element={<ProtectedRoute element={<Notes />} />} />
      </Routes>
    </Router>
  );
}

export default App;
