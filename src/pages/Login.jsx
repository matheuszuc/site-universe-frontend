import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'

export default function Login() {
  function handleSubmit(event) {
    event.preventDefault()
    alert('Login visual pronto. A autenticação real será conectada no backend depois.')
  }

  return (
    <div className="auth-page">
      <Header />

      <main className="auth-container">
        <form onSubmit={handleSubmit}>
          <h1>Universe Login</h1>

          <div className="input-box">
            <input required placeholder="Usuário" type="text" name="username" autoComplete="username" />
            <i className="bx bxs-user"></i>
          </div>

          <div className="input-box">
            <input required placeholder="Senha" type="password" name="password" autoComplete="current-password" />
            <i className="bx bxs-lock-alt"></i>
          </div>

          <div className="remember-forgot">
            <label>
              <input type="checkbox" />
              Lembrar senha
            </label>
            <a href="#recuperar-senha">Esqueci a senha</a>
          </div>

          <button type="submit" className="login-button">
            Login
          </button>

          <div className="register-link">
            <p>
              Não tem uma conta? <Link to="/registro">Cadastre-se</Link>
            </p>
          </div>
        </form>
      </main>
    </div>
  )
}
