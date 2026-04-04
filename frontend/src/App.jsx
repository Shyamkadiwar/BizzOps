import Signup from "./pages/Signup.jsx";
import Signin from "./pages/Signin.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
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
import DealsPage from "./pages/DealsPage.jsx";
import TaskPage from "./pages/TaskPage.jsx";
import AppointmentPage from "./pages/AppointmentPage.jsx";
import CalendarPage from "./pages/CalendarPage.jsx";
import StaffTaskPage from "./pages/StaffTaskPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import Terms from "./components/Terms.jsx";
import Privacy from "./components/Privacy.jsx";
import Contact from "./components/Contact.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Signin />} />
        <Route path="/register" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/Customizes" element={<Customizes />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/contact" element={<Contact />} />

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
        <Route path="/Deals" element={<ProtectedRoute element={<DealsPage />} />} />
        <Route path="/Task" element={<ProtectedRoute element={<TaskPage />} />} />
        <Route path="/Appointment" element={<ProtectedRoute element={<AppointmentPage />} />} />
        <Route path="/Calendar" element={<ProtectedRoute element={<CalendarPage />} />} />
        <Route path="/StaffTask" element={<ProtectedRoute element={<StaffTaskPage />} />} />
        <Route path="/settings" element={<ProtectedRoute element={<SettingsPage />} />} />
      </Routes>
    </Router>
  );
}

export default App;
