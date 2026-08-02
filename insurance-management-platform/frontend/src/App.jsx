import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import CustomerHome from "./pages/CustomerHome.jsx";
import Customers from "./pages/Customers.jsx";
import Policies from "./pages/Policies.jsx";
import Claims from "./pages/Claims.jsx";
import Premiums from "./pages/Premiums.jsx";
import Documents from "./pages/Documents.jsx";
import Reports from "./pages/Reports.jsx";

// Guards routes that only staff (administrator / agent) may open.
function StaffRoute({ children }) {
  const { isStaff } = useAuth();
  return isStaff ? children : <Navigate to="/" replace />;
}

export default function App() {
  const { user, isStaff } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={isStaff ? <Dashboard /> : <CustomerHome />} />
        <Route path="/customers" element={<StaffRoute><Customers /></StaffRoute>} />
        <Route path="/policies" element={<Policies />} />
        <Route path="/claims" element={<Claims />} />
        <Route path="/premiums" element={<Premiums />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/reports" element={<StaffRoute><Reports /></StaffRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
