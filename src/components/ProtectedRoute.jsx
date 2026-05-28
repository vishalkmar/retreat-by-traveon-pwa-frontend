import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ProtectedRoute = ({ roles, children }) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="app-shell items-center justify-center">
        <div className="animate-pulse text-brand-700">Loading…</div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }
  if (roles && !roles.includes(role)) {
    // Wrong role for this route — bounce to that role's home.
    const home =
      role === 'officer' ? '/officer'
      : role === 'owner' ? '/owner'
      : role === 'salesperson' ? '/salesperson'
      : '/auditor';
    return <Navigate to={home} replace />;
  }
  return children;
};

export default ProtectedRoute;
