import { Link } from 'react-router-dom'
import PublicLayout from '../components/layout/PublicLayout'

const sections = [
  {
    title: 'Aceitação dos termos',
    content:
      'Ao criar uma conta ou utilizar o Site Universe, o usuário declara que leu, compreendeu e concorda com estas condições de uso. Caso não concorde, não deve utilizar os recursos da plataforma.',
  },
  {
    title: 'Criação de conta',
    content:
      'Para acessar determinadas áreas, o usuário poderá precisar informar dados como nome de usuário, e-mail e senha. As informações fornecidas devem ser verdadeiras, atuais e pertencentes ao próprio usuário.',
  },
  {
    title: 'Responsabilidade do usuário',
    content:
      'O usuário é responsável pelas ações realizadas em sua conta, pelo uso adequado da plataforma e pelo respeito às regras de convivência, segurança e boa-fé.',
  },
  {
    title: 'Segurança da conta',
    content:
      'O usuário deve manter sua senha em sigilo, escolher credenciais seguras e informar o suporte caso perceba qualquer acesso não autorizado ou atividade suspeita.',
  },
  {
    title: 'Uso permitido da plataforma',
    content:
      'A plataforma deve ser utilizada para fins lícitos, respeitando outros usuários, a equipe do Site Universe e a integridade dos serviços oferecidos.',
  },
  {
    title: 'Condutas proibidas',
    content:
      'Não é permitido tentar burlar sistemas, explorar falhas, praticar fraude, assédio, disseminar conteúdo ofensivo, automatizar ações indevidas ou comprometer a experiência de outros usuários.',
  },
  {
    title: 'Integração futura com jogo/chat',
    content:
      'O Site Universe poderá se conectar a recursos de jogo, chat e comunidade em etapas futuras. Essas funcionalidades poderão ter regras próprias, comunicadas de forma clara quando forem disponibilizadas.',
  },
  {
    title: 'Compras, recompensas e créditos futuros',
    content:
      'Recursos relacionados a compras, recompensas, créditos ou benefícios digitais poderão ser oferecidos em módulos futuros. Quando existirem, suas condições, limitações e regras serão apresentadas antes do uso.',
  },
  {
    title: 'Suspensão ou bloqueio de conta',
    content:
      'Contas poderão ser suspensas ou bloqueadas em caso de uso indevido, violação destes termos, suspeita de fraude, risco à segurança ou descumprimento de regras da plataforma.',
  },
  {
    title: 'Alterações nos termos',
    content:
      'Estes termos poderão ser atualizados para refletir melhorias, novas funcionalidades, ajustes legais ou mudanças operacionais. A versão mais recente ficará disponível nesta página.',
  },
  {
    title: 'Contato e suporte',
    content:
      'Dúvidas, solicitações e comunicações relacionadas ao uso da plataforma poderão ser encaminhadas pelos canais oficiais de suporte do Site Universe.',
  },
]

const showReviewNotice = import.meta.env.DEV

export default function TermsOfUse() {
  return (
    <PublicLayout>
      <main className="legal-page">
        <section className="legal-hero">
          <p className="legal-kicker">Site Universe</p>
          <h1>Termos de Uso</h1>
          <p>
            Estas condições apresentam as regras iniciais para uso do Site Universe e servem como base
            para uma experiência segura, clara e respeitosa.
          </p>
          <div className="legal-actions">
            <Link to="/register">Voltar ao cadastro</Link>
            <Link to="/">Ir para Home</Link>
          </div>
        </section>

        {showReviewNotice && (
          <p className="legal-notice">
            Este conteúdo é uma base inicial e deve ser revisado antes da publicação oficial.
          </p>
        )}

        <section className="legal-content" aria-label="Seções dos Termos de Uso">
          {sections.map((section) => (
            <article className="legal-section" key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.content}</p>
            </article>
          ))}
        </section>
      </main>
    </PublicLayout>
  )
}
