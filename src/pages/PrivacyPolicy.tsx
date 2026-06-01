import { Link } from 'react-router-dom'
import PublicLayout from '../components/layout/PublicLayout'

const sections = [
  {
    title: 'Dados coletados no cadastro',
    content:
      'Durante o cadastro, o Site Universe poderá solicitar informações como nome de usuário, e-mail e senha. Esses dados são necessários para identificação da conta e acesso aos recursos da plataforma.',
  },
  {
    title: 'Uso do e-mail',
    content:
      'O e-mail poderá ser utilizado para confirmação de conta, recuperação de senha, comunicações importantes de segurança e mensagens relacionadas ao funcionamento da plataforma.',
  },
  {
    title: 'Verificação de conta',
    content:
      'A verificação de conta ajuda a proteger o usuário e reduzir abusos. Mensagens de confirmação poderão ser enviadas ao e-mail informado no cadastro.',
  },
  {
    title: 'Recuperação de senha',
    content:
      'Quando solicitado, o sistema poderá enviar instruções de recuperação de senha ao e-mail cadastrado, usando mensagens genéricas para proteger a privacidade dos usuários.',
  },
  {
    title: 'Segurança da conta',
    content:
      'Medidas de segurança poderão ser aplicadas para proteger contas, impedir acessos indevidos e preservar a integridade da plataforma.',
  },
  {
    title: 'Logs e prevenção de abuso',
    content:
      'Informações técnicas de acesso e uso poderão ser registradas para detectar fraudes, tentativas de invasão, abuso, instabilidade ou violações das regras da plataforma.',
  },
  {
    title: 'Cookies ou tecnologias semelhantes',
    content:
      'Cookies ou tecnologias semelhantes poderão ser usados para manter preferências, melhorar a navegação, proteger sessões e entender o funcionamento geral da plataforma.',
  },
  {
    title: 'Compartilhamento de dados',
    content:
      'Dados pessoais não devem ser vendidos. O compartilhamento poderá ocorrer apenas quando necessário para operação do serviço, cumprimento legal, segurança ou suporte autorizado.',
  },
  {
    title: 'Armazenamento e proteção dos dados',
    content:
      'Os dados serão tratados pelo sistema de forma proporcional à finalidade de uso, com medidas de proteção compatíveis com a natureza das informações.',
  },
  {
    title: 'Direitos do usuário',
    content:
      'O usuário poderá solicitar informações sobre seus dados, correções, atualizações ou outras medidas previstas pela legislação aplicável, por meio dos canais oficiais de contato.',
  },
  {
    title: 'Alterações na política',
    content:
      'Esta política poderá ser atualizada para refletir melhorias, novas funcionalidades, ajustes legais ou mudanças na operação do Site Universe.',
  },
  {
    title: 'Contato e suporte',
    content:
      'Dúvidas sobre privacidade, segurança ou tratamento de dados poderão ser enviadas pelos canais oficiais de suporte do Site Universe.',
  },
]

const showReviewNotice = import.meta.env.DEV

export default function PrivacyPolicy() {
  return (
    <PublicLayout>
      <main className="legal-page">
        <section className="legal-hero">
          <p className="legal-kicker">Site Universe</p>
          <h1>Política de Privacidade</h1>
          <p>
            Esta política explica, de forma inicial, como dados e informações poderão ser tratados para
            proteger contas, melhorar a experiência e manter a plataforma segura.
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

        <section className="legal-content" aria-label="Seções da Política de Privacidade">
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
