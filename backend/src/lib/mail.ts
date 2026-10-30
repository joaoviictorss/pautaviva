import { APIError } from 'better-auth/api'
import nodemailer from 'nodemailer'

import { env } from '../env.js'

const transporter = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      // 465 é TLS direto; nas demais (587) a conexão sobe com STARTTLS.
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    })
  : null

const mailFrom = env.MAIL_FROM || `PautaViva <${env.SMTP_USER}>`

interface SendMailParams {
  to: string
  subject: string
  html: string
  text: string
}

/**
 * Lança erro quando o provedor recusa o envio, pra rota de reenvio devolver
 * falha ao front. No cadastro e na redefinição de senha o Better Auth captura
 * esse erro e só registra no log (o cadastro não pode falhar por causa disso).
 */
async function sendMail({ to, subject, html, text }: SendMailParams) {
  if (!transporter) {
    console.log(`[mail] SMTP_HOST ausente, e-mail não enviado.\n  para: ${to}\n  assunto: ${subject}\n  ${text}`)
    return
  }

  try {
    await transporter.sendMail({ from: mailFrom, to, subject, html, text })
  } catch (error) {
    console.error(`[mail] falha ao enviar "${subject}" para ${to}:`, error)
    throw new APIError('BAD_GATEWAY', {
      code: 'EMAIL_SEND_FAILED',
      message: 'Não foi possível enviar o e-mail.',
    })
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
}

interface ActionEmailParams {
  heading: string
  intro: string
  action: string
  url: string
  outro: string
}

/**
 * Template único: título, texto, botão e o link por extenso. As cores ficam
 * inline (clientes que ignoram <style>) e o bloco de dark mode sobrescreve
 * por classe nos clientes que suportam prefers-color-scheme.
 */
function actionEmail({ heading, intro, action, url, outro }: ActionEmailParams) {
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    @media (prefers-color-scheme: dark) {
      .bg { background: #0c0a09 !important; }
      .card { background: #1c1917 !important; border-color: #292524 !important; }
      .heading { color: #fafaf9 !important; }
      .body { color: #d6d3d1 !important; }
      .muted { color: #a8a29e !important; }
      .faint { color: #78716c !important; }
      .rule { border-color: #292524 !important; }
    }
  </style>
</head>
<body class="bg" style="margin:0;padding:0;background:#f5f5f4;font-family:'Plus Jakarta Sans',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased">
  <table role="presentation" class="bg" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:40px 16px">
    <tr><td align="center">
      <table role="presentation" class="card" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e7e5e4;border-radius:14px">
        <tr><td style="padding:32px 32px 0">
          <span style="display:inline-block;font-weight:700;font-size:17px;letter-spacing:-0.02em;color:#F2470C">PautaViva</span>
        </td></tr>
        <tr><td class="heading" style="padding:28px 32px 10px;font-weight:700;font-size:24px;line-height:1.25;letter-spacing:-0.02em;color:#1c1917">${escapeHtml(heading)}</td></tr>
        <tr><td class="body" style="padding:0 32px 28px;font-size:15px;line-height:1.6;color:#44403c">${escapeHtml(intro)}</td></tr>
        <tr><td style="padding:0 32px 28px">
          <a href="${escapeHtml(url)}" style="display:inline-block;background:#F2470C;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;line-height:1;padding:15px 24px;border-radius:14px">${escapeHtml(action)}</a>
        </td></tr>
        <tr><td class="muted" style="padding:0 32px 24px;font-size:13px;line-height:1.6;color:#78716c">${escapeHtml(outro)}</td></tr>
        <tr><td style="padding:0 32px 32px">
          <div class="rule faint" style="border-top:1px solid #e7e5e4;padding-top:20px;font-size:12px;line-height:1.6;color:#a8a29e;word-break:break-all">
            Se o botão não funcionar, copie e cole este link no navegador:<br>
            <a href="${escapeHtml(url)}" class="faint" style="color:#a8a29e;text-decoration:underline">${escapeHtml(url)}</a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const text = `${heading}\n\n${intro}\n\n${action}: ${url}\n\n${outro}`

  return { html, text }
}

export function sendVerificationMail(to: string, name: string, url: string) {
  return sendMail({
    to,
    subject: 'Confirme seu e-mail no PautaViva',
    ...actionEmail({
      heading: `Olá, ${name.split(' ')[0]}`,
      intro: 'Falta só um passo: confirme este e-mail para usar sua conta e votar nas pautas da sua comunidade.',
      action: 'Confirmar e-mail',
      url,
      outro: 'O link vale por 1 hora. Se você não fez esse pedido, ignore esta mensagem.',
    }),
  })
}

export function sendResetPasswordMail(to: string, name: string, url: string) {
  return sendMail({
    to,
    subject: 'Redefina sua senha do PautaViva',
    ...actionEmail({
      heading: `Olá, ${name.split(' ')[0]}`,
      intro: 'Recebemos um pedido para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova.',
      action: 'Criar nova senha',
      url,
      outro: 'O link vale por 1 hora. Se você não pediu a redefinição, ignore esta mensagem; sua senha continua a mesma.',
    }),
  })
}

export function sendPollOpenedMail(to: string, name: string, title: string, url: string) {
  return sendMail({
    to,
    subject: `A votação abriu: ${title}`,
    ...actionEmail({
      heading: `Olá, ${name.split(' ')[0]}`,
      intro: `A pauta "${title}", que você pediu para acompanhar, já está aberta para votação.`,
      action: 'Votar agora',
      url,
      outro: 'Você recebeu este aviso porque ativou um lembrete nesta pauta.',
    }),
  })
}

interface NoticeMailParams {
  subject: string
  intro: string
  action: string
  url: string
  outro?: string
}

export function sendNoticeMail(to: string, name: string, { subject, intro, action, url, outro }: NoticeMailParams) {
  return sendMail({
    to,
    subject,
    ...actionEmail({
      heading: `Olá, ${name.split(' ')[0]}`,
      intro,
      action,
      url,
      outro: outro ?? 'Você recebeu este aviso porque ativou esta notificação. Para desativar, acesse Configurações.',
    }),
  })
}
