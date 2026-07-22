import nodemailer from "nodemailer";

type EnrollmentMailData = {
  to: string;
  learnerName: string;
  formationTitle: string;
  startDate?: Date | null;
  location?: string | null;
};

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT ?? 465);
const smtpSecure = (process.env.SMTP_SECURE ?? "true").toLowerCase() === "true";
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const mailFrom = process.env.SMTP_FROM ?? (smtpUser ? `IN ACADEMY <${smtpUser}>` : undefined);

const transporter = smtpHost && smtpUser && smtpPass
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })
  : null;

function formatDate(date?: Date | null) {
  if (!date) return null;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function sendMail(to: string, subject: string, html: string, text: string) {
  if (!transporter || !mailFrom) {
    console.warn("[mail] SMTP non configure, email ignore:", subject, to);
    return;
  }

  await transporter.sendMail({
    from: mailFrom,
    to,
    subject,
    html,
    text,
  });
}

function enrollmentHtml(title: string, intro: string, data: EnrollmentMailData, arrivalTime?: string) {
  const date = formatDate(data.startDate);
  const safeName = escapeHtml(data.learnerName);
  const safeFormation = escapeHtml(data.formationTitle);
  const safeLocation = data.location ? escapeHtml(data.location) : null;

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f2340;max-width:620px;margin:0 auto;padding:24px">
      <h1 style="font-size:22px;margin:0 0 16px;color:#0b2545">${escapeHtml(title)}</h1>
      <p>Bonjour ${safeName},</p>
      <p>${escapeHtml(intro)}</p>
      <div style="border:1px solid #e5dccd;border-radius:10px;padding:16px;margin:20px 0;background:#fbf7ef">
        <strong style="display:block;margin-bottom:8px">${safeFormation}</strong>
        ${date ? `<div>Date : ${escapeHtml(date)}</div>` : ""}
        ${arrivalTime ? `<div>Heure d'arrivée : ${escapeHtml(arrivalTime)}</div>` : ""}
        ${safeLocation ? `<div>Lieu : ${safeLocation}</div>` : ""}
      </div>
      <p style="margin-top:20px">Equipe IN ACADEMY</p>
    </div>
  `;
}

export async function sendEnrollmentPendingEmail(data: EnrollmentMailData) {
  const subject = "Inscription recue - paiement requis";
  const intro = "Votre demande d'inscription a bien ete recue. Elle sera validee une fois le paiement effectue.";
  const details = `${data.formationTitle}${data.startDate ? ` - ${formatDate(data.startDate)}` : ""}`;

  await sendMail(
    data.to,
    subject,
    enrollmentHtml("Inscription en attente de paiement", intro, data),
    `Bonjour ${data.learnerName}, votre demande d'inscription a bien ete recue. Elle sera validee une fois le paiement effectue. Formation: ${details}.`
  );
}

export async function sendEnrollmentConfirmedEmail(data: EnrollmentMailData) {
  const subject = "Inscription confirmee";
  const intro =
    "Votre inscription a ete confirmee par notre administration. Merci de vous presenter le jour de la formation a 09h00.";
  const details = `${data.formationTitle}${data.startDate ? ` - ${formatDate(data.startDate)}` : ""}`;

  await sendMail(
    data.to,
    subject,
    enrollmentHtml("Inscription confirmee", intro, data, "09h00"),
    `Bonjour ${data.learnerName}, votre inscription a ete confirmee. Merci de vous presenter le jour de la formation a 09h00. Formation: ${details}.`
  );
}

// Notification générique à l'administration (dépôt de reçu, nouvelle candidature, etc.)
const adminEmail = process.env.ADMIN_EMAIL ?? smtpUser;

export async function sendAdminNotificationEmail(subject: string, lines: string[]) {
  if (!adminEmail) {
    console.warn("[mail] ADMIN_EMAIL non configuré, notification admin ignorée:", subject);
    return;
  }
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f2340;max-width:620px;margin:0 auto;padding:24px">
      <h1 style="font-size:20px;margin:0 0 16px;color:#0b2545">${escapeHtml(subject)}</h1>
      ${lines.map((l) => `<p style="margin:6px 0">${escapeHtml(l)}</p>`).join("")}
      <p style="margin-top:20px;color:#8a8a8a;font-size:13px">Notification automatique — back-office IN ACADEMY</p>
    </div>`;
  await sendMail(adminEmail, subject, html, lines.join("\n"));
}
