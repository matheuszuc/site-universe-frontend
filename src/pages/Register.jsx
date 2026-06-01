import { useState } from 'react'
import Header from '../components/Header.jsx'

const initialValues = {
  username: '',
  email: '',
  password: '',
  passwordConfirmation: '',
}

export default function Register() {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
  }

  function validate(fieldValues = values) {
    const newErrors = {}

    if (!fieldValues.username.trim()) {
      newErrors.username = 'Preencha o nome de usuário!'
    }

    if (!fieldValues.email.trim()) {
      newErrors.email = 'O email é obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fieldValues.email)) {
      newErrors.email = 'Digite um email válido'
    }

    if (!fieldValues.password) {
      newErrors.password = 'A senha é obrigatória'
    } else if (fieldValues.password.length < 5) {
      newErrors.password = 'A senha precisa ter no mínimo 5 caracteres'
    }

    if (!fieldValues.passwordConfirmation) {
      newErrors.passwordConfirmation = 'Confirme sua senha'
    } else if (fieldValues.passwordConfirmation !== fieldValues.password) {
      newErrors.passwordConfirmation = 'As senhas não são iguais'
    }

    return newErrors
  }

  function handleBlur() {
    setErrors(validate())
  }

  function handleSubmit(event) {
    event.preventDefault()
    const validationErrors = validate()
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length === 0) {
      alert('Cadastro visual validado. O envio real será conectado na API depois.')
      setValues(initialValues)
    }
  }

  return (
    <div className="auth-page">
      <Header />

      <main className="auth-container register-container">
        <section className="auth-header">
          <h1>Registro Universe</h1>
        </section>

        <form className="form" onSubmit={handleSubmit} noValidate>
          <FormField
            id="username"
            name="username"
            type="text"
            placeholder="Digite o nome do usuário"
            value={values.username}
            error={errors.username}
            onChange={handleChange}
            onBlur={handleBlur}
          />

          <FormField
            id="email"
            name="email"
            type="email"
            placeholder="Digite o email"
            value={values.email}
            error={errors.email}
            onChange={handleChange}
            onBlur={handleBlur}
          />

          <FormField
            id="password"
            name="password"
            type="password"
            placeholder="Digite a senha"
            value={values.password}
            error={errors.password}
            onChange={handleChange}
            onBlur={handleBlur}
          />

          <FormField
            id="password-confirmation"
            name="passwordConfirmation"
            type="password"
            placeholder="Digite sua senha novamente"
            value={values.passwordConfirmation}
            error={errors.passwordConfirmation}
            onChange={handleChange}
            onBlur={handleBlur}
          />

          <button type="submit" className="login-button">
            Registrar
          </button>
        </form>
      </main>
    </div>
  )
}

function FormField({ id, name, type, placeholder, value, error, onChange, onBlur }) {
  return (
    <div className={`form-content ${error ? 'error' : ''}`}>
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        autoComplete={type === 'password' ? 'new-password' : name}
      />
      <a>{error || 'Aqui vai a mensagem de erro'}</a>
    </div>
  )
}
