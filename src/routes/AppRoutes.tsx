import { Route, Routes } from 'react-router-dom'
import AdminDashboard from '../pages/AdminDashboard'
import ForgotPassword from '../pages/ForgotPassword'
import Home from '../pages/Home'
import Download from '../pages/Download'
import Login from '../pages/Login'
import NotFound from '../pages/NotFound'
import PrivacyPolicy from '../pages/PrivacyPolicy'
import Register from '../pages/Register'
import ResetPassword from '../pages/ResetPassword'
import TermsOfUse from '../pages/TermsOfUse'
import UpdateLegacyAccount from '../pages/UpdateLegacyAccount'
import UserDashboard from '../pages/UserDashboard'
import UserRewardScale from '../pages/UserRewardScale'
import UserStore from '../pages/UserStore'
import VerifyEmail from '../pages/VerifyEmail'
import AdminRoute from './AdminRoute'
import ProtectedRoute from './ProtectedRoute'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/download" element={<Download />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/verificar-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/atualizar-conta" element={<UpdateLegacyAccount />} />
      <Route path="/terms" element={<TermsOfUse />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/painel"
        element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/painel/loja"
        element={
          <ProtectedRoute>
            <UserStore />
          </ProtectedRoute>
        }
      />
      <Route
        path="/painel/recompensas"
        element={
          <ProtectedRoute>
            <UserRewardScale />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/store"
        element={
          <ProtectedRoute>
            <UserStore />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/rewards"
        element={
          <ProtectedRoute>
            <UserRewardScale />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
