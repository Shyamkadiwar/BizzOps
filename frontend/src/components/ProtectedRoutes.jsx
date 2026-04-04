import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './Context/AuthContext';

const ProtectedRoute = ({ element }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Paywall Logic
  const now = new Date();
  let hasValidAccess = false;
  
  if (user) {
    if (user.subscriptionStatus === 'active') {
      if (user.subscriptionEndsAt && new Date(user.subscriptionEndsAt) > now) {
        hasValidAccess = true;
      }
    } else if (user.subscriptionStatus === 'trialing') {
      if (user.trialEndsAt && new Date(user.trialEndsAt) > now) {
        hasValidAccess = true;
      }
    }
  }

  // Always allow access to settings page regardless of subscription so they can pay & interact with their profile
  if (location.pathname === '/settings') {
    return element;
  }

  // If expired, completely lock them out of everything else and redirect to billing
  if (!hasValidAccess) {
    return <Navigate to="/settings" state={{ tab: 'billing', requirePayment: true }} />;
  }

  return element;
};

export default ProtectedRoute;