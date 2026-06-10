import AppRoutes from './routes/AppRoutes'
import { AuthProvider } from './contexts/AuthContext'
import { I18nProvider } from './i18n'

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </I18nProvider>
  )
}
