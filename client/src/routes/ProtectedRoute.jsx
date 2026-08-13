import { Navigate } from "react-router-dom";
import { useStores } from "../stores/useStores";

export function ProtectedRoute({ children }) {
  const { authStore } = useStores();

  if (!authStore?.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
