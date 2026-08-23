import { Navigate } from "react-router-dom";
import { useStores } from "../stores/useStores";

// `role` is optional. Without it this behaves exactly as it always has: logged
// in or go to /login. With it, the user must also hold that role.
//
// The two refusals are deliberately different. Not logged in sends you to
// /login, because logging in fixes it. Logged in but wrong role sends you home,
// because logging in again will not help — a player is not one form away from
// being an admin.
export function ProtectedRoute({ children, role }) {
  const { authStore } = useStores();

  if (!authStore?.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && authStore.user?.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}
