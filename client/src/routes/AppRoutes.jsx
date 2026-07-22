import { Route, Routes } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import UserManagementPage from "../pages/admin/UserManagementPage";
import AttributeListPage from "../pages/attributes/AttributeListPage";
import LoginPage from "../pages/auth/LoginPage";
import CvDetailPage from "../pages/cvs/CvDetailPage";
import CvListPage from "../pages/cvs/CvListPage";
import HomePage from "../pages/HomePage";
import NotFoundPage from "../pages/NotFoundPage";
import PositionDetailPage from "../pages/positions/PositionDetailPage";
import PositionEditorPage from "../pages/positions/PositionEditorPage";
import PositionListPage from "../pages/positions/PositionListPage";
import ProfilePage from "../pages/profiles/ProfilePage";
import PublicProfilePage from "../pages/profiles/PublicProfilePage";
import SearchPage from "../pages/SearchPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

export default function AppRoutes() {
  return <Routes><Route element={<AppLayout />}>
    <Route path="/" element={<HomePage />} /><Route path="/login" element={<LoginPage />} /><Route path="/unauthorized" element={<UnauthorizedPage />} /><Route path="/positions" element={<PositionListPage />} /><Route path="/positions/:id" element={<PositionDetailPage />} /><Route path="/search" element={<SearchPage />} />
    <Route element={<ProtectedRoute />}><Route path="/profile" element={<ProfilePage />} /><Route path="/cvs" element={<CvListPage />} /><Route path="/cvs/:id" element={<CvDetailPage />} /><Route path="/public-profile/:id" element={<PublicProfilePage />} />
      <Route element={<RoleRoute allowedRoles={["RECRUITER", "ADMIN"]} />}><Route path="/attributes" element={<AttributeListPage />} /><Route path="/positions/new" element={<PositionEditorPage />} /><Route path="/positions/:id/edit" element={<PositionEditorPage />} /></Route>
      <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}><Route path="/admin/users" element={<UserManagementPage />} /><Route path="/admin/users/:userId/profile" element={<ProfilePage />} /></Route>
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Route></Routes>;
}
