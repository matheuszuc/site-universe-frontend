# Site Universe - React + Tailwind

Frontend publico inicial do Site Universe, preparado para integracao futura com backend.

## Stack

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- React Hook Form
- Zod

## Como rodar

```bash
npm install
npm run dev
```

Depois abra o endereco mostrado pelo Vite no terminal.

## Rotas

- `/` - Home
- `/login` - Login
- `/register` - Registro
- `/verify-email` - Verificacao de e-mail
- `/forgot-password` - Recuperacao de senha
- `/reset-password` - Redefinicao de senha
- `*` - NotFound

## Escopo

Este modulo contem somente telas publicas, validacoes visuais e funcoes placeholder para futura API. O frontend nao salva token, nao salva senha, nao faz hash de senha, nao envia e-mail diretamente e nao implementa pagamento, recompensa, saldo, banco de dados ou regra sensivel.

Toda autenticacao real, sessao, validacao de token, envio de e-mail, rate limit, logs, permissoes e hash seguro de senha devem ser implementados no backend.
