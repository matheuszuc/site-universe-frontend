# Site Universe — React + Tailwind

Migração inicial do projeto HTML/CSS/JS para React com Vite, Tailwind CSS e React Router.

## O que foi migrado

- Home com carrossel de classes/personagens
- Login visual
- Registro com validação em React
- Header reutilizável
- Imagens centralizadas em `public/images`
- CSS original reaproveitado e reorganizado para evitar conflitos

## Como rodar

```bash
npm install
npm run dev
```

Depois abra o endereço mostrado pelo Vite no terminal.

## Rotas

- `/` — Home
- `/login` — Login
- `/registro` — Registro

## Próximos passos recomendados

1. Ajustar responsividade fina da Home.
2. Criar o painel do usuário em `/painel`.
3. Separar componentes de formulário, botão e cards.
4. Conectar login/registro com API real.
5. Implementar autenticação segura no backend.
6. Depois integrar pagamento, webhooks e recompensas no jogo.

## Observação importante

Login e Registro ainda são somente front-end. Não confie em validação do front-end para segurança real. Senha, sessão, token, pagamento e recompensa precisam ser validados no backend.
