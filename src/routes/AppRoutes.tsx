import { Route, Routes } from 'react-router-dom'
import ForgotPassword from '../pages/ForgotPassword'
import Home from '../pages/Home'
import Login from '../pages/Login'
import NotFound from '../pages/NotFound'
import PrivacyPolicy from '../pages/PrivacyPolicy'
import Register from '../pages/Register'
import ResetPassword from '../pages/ResetPassword'
import TermsOfUse from '../pages/TermsOfUse'
import VerifyEmail from '../pages/VerifyEmail'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/terms" element={<TermsOfUse />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
