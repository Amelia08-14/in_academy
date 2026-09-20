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

// Email au client entreprise quand l'admin lui envoie un devis (tâche 7).
export async function sendQuoteSentEmail(data: { to: string; company: string; formations: string[] }) {
  const subject = "Votre devis IN ACADEMY est disponible";
  const list = data.formations.map((f) => `<li>${escapeHtml(f)}</li>`).join("");
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f2340;max-width:620px;margin:0 auto;padding:24px">
      <h1 style="font-size:20px;margin:0 0 16px;color:#0b2545">Votre devis est prêt</h1>
      <p>Bonjour ${escapeHtml(data.company)},</p>
      <p>Votre devis pour les formations suivantes a été préparé par notre équipe :</p>
      <ul>${list}</ul>
      <p>Connectez-vous à votre espace entreprise pour le consulter, l'accepter ou le refuser (après dépôt du reçu de paiement).</p>
      <p style="margin-top:20px">Équipe IN ACADEMY</p>
    </div>`;
  await sendMail(
    data.to,
    subject,
    html,
    `Bonjour ${data.company}, votre devis IN ACADEMY est disponible dans votre espace entreprise. Formations : ${data.formations.join(", ")}.`
  );
}

type EventRegistrationMailData = {
  to: string;
  fullName: string;
  eventTitle: string;
  eventDate: Date;
  location?: string | null;
};

function eventRegistrationHtml(title: string, intro: string, data: EventRegistrationMailData) {
  const date = formatDate(data.eventDate);
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f2340;max-width:620px;margin:0 auto;padding:24px">
      <h1 style="font-size:20px;margin:0 0 16px;color:#0b2545">${escapeHtml(title)}</h1>
      <p>Bonjour ${escapeHtml(data.fullName)},</p>
      <p>${escapeHtml(intro)}</p>
      <div style="border:1px solid #e5dccd;border-radius:10px;padding:16px;margin:20px 0;background:#fbf7ef">
        <strong style="display:block;margin-bottom:8px">${escapeHtml(data.eventTitle)}</strong>
        ${date ? `<div>Date : ${escapeHtml(date)}</div>` : ""}
        ${data.location ? `<div>Lieu : ${escapeHtml(data.location)}</div>` : ""}
      </div>
      <p style="margin-top:20px">Équipe IN ACADEMY</p>
    </div>`;
}

// Envoyé dès l'inscription — la place n'est pas encore garantie, elle attend une validation admin.
export async function sendEventRegistrationPendingEmail(data: EventRegistrationMailData) {
  const subject = `Inscription reçue — ${data.eventTitle}`;
  const intro = "Votre inscription a bien été reçue. Elle sera validée par notre équipe.";
  await sendMail(
    data.to,
    subject,
    eventRegistrationHtml("Inscription reçue", intro, data),
    `Bonjour ${data.fullName}, votre inscription à "${data.eventTitle}" a bien été reçue. Elle sera validée par notre équipe.`
  );
}

// Envoyé quand l'admin valide l'inscription depuis le back-office.
export async function sendEventRegistrationConfirmedEmail(data: EventRegistrationMailData) {
  const subject = `Inscription confirmée — ${data.eventTitle}`;
  const intro = "Votre inscription a été validée par notre équipe — votre place est confirmée.";
  await sendMail(
    data.to,
    subject,
    eventRegistrationHtml("Inscription confirmée", intro, data),
    `Bonjour ${data.fullName}, votre inscription à "${data.eventTitle}" est confirmée.`
  );
}

// Envoyé quand l'admin refuse l'inscription (événement complet, forte demande…).
export async function sendEventRegistrationRejectedEmail(data: EventRegistrationMailData) {
  const subject = `Concernant votre inscription — ${data.eventTitle}`;
  const intro =
    "Nous vous remercions vivement pour l'intérêt que vous portez à cet événement. " +
    "Face à une forte demande, la capacité d'accueil a malheureusement été atteinte et nous sommes " +
    "au regret de ne pouvoir vous y accueillir cette fois-ci. Nous espérons avoir le plaisir de vous " +
    "retrouver lors de nos prochains événements.";
  await sendMail(
    data.to,
    subject,
    eventRegistrationHtml("Votre inscription n'a pas pu être retenue", intro, data),
    `Bonjour ${data.fullName}, nous vous remercions pour votre intérêt envers "${data.eventTitle}". ` +
    `Face à une forte demande, la capacité d'accueil a été atteinte et nous ne pouvons malheureusement pas vous y accueillir cette fois-ci. ` +
    `Nous espérons vous retrouver lors de nos prochains événements.`
  );
}

// Email « mot de passe oublié » — lien de réinitialisation à usage unique.
export async function sendPasswordResetEmail(data: { to: string; resetUrl: string }) {
  const subject = "Réinitialisation de votre mot de passe IN ACADEMY";
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f2340;max-width:620px;margin:0 auto;padding:24px">
      <h1 style="font-size:20px;margin:0 0 16px;color:#0b2545">Réinitialisation de mot de passe</h1>
      <p>Vous avez demandé la réinitialisation de votre mot de passe IN ACADEMY.</p>
      <p style="margin:24px 0">
        <a href="${data.resetUrl}" style="background:#c4922a;color:#0f2340;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
          Choisir un nouveau mot de passe
        </a>
      </p>
      <p style="color:#6b7280;font-size:13px">Ce lien est valable 1 heure et ne peut être utilisé qu'une seule fois. Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.</p>
      <p style="margin-top:20px">Équipe IN ACADEMY</p>
    </div>`;
  await sendMail(
    data.to,
    subject,
    html,
    `Réinitialisez votre mot de passe IN ACADEMY en suivant ce lien (valable 1 heure) : ${data.resetUrl}`
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

// ─── Inscription directe à une session métier (sans compte) ──────────────────

type SessionRegistrationMailData = {
  to: string;
  fullName: string;
  sessionTitle: string;
  startDate: Date;
  location?: string | null;
};

function sessionRegistrationHtml(title: string, intro: string, data: SessionRegistrationMailData) {
  const date = formatDate(data.startDate);
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f2340;max-width:620px;margin:0 auto;padding:24px">
      <h1 style="font-size:20px;margin:0 0 16px;color:#0b2545">${escapeHtml(title)}</h1>
      <p>Bonjour ${escapeHtml(data.fullName)},</p>
      <p>${escapeHtml(intro)}</p>
      <div style="border:1px solid #e5dccd;border-radius:10px;padding:16px;margin:20px 0;background:#fbf7ef">
        <strong style="display:block;margin-bottom:8px">${escapeHtml(data.sessionTitle)}</strong>
        ${date ? `<div>Début : ${escapeHtml(date)}</div>` : ""}
        ${data.location ? `<div>Lieu : ${escapeHtml(data.location)}</div>` : ""}
      </div>
      <p style="margin-top:20px">Équipe IN ACADEMY</p>
    </div>`;
}

// Envoyé dès la demande — la place n'est pas encore garantie, elle attend la validation admin.
export async function sendSessionRegistrationPendingEmail(data: SessionRegistrationMailData) {
  const intro = "Votre demande d'inscription a bien été reçue. Notre équipe vous recontactera très prochainement pour la valider.";
  await sendMail(
    data.to,
    `Demande d'inscription reçue — ${data.sessionTitle}`,
    sessionRegistrationHtml("Demande d'inscription reçue", intro, data),
    `Bonjour ${data.fullName}, votre demande d'inscription à "${data.sessionTitle}" a bien été reçue. Notre équipe vous recontactera très prochainement.`
  );
}

// Envoyé quand l'admin valide l'inscription.
export async function sendSessionRegistrationConfirmedEmail(data: SessionRegistrationMailData) {
  const intro = "Votre inscription a été validée par notre équipe — votre place est confirmée. Nous vous contacterons pour les modalités pratiques.";
  await sendMail(
    data.to,
    `Inscription confirmée — ${data.sessionTitle}`,
    sessionRegistrationHtml("Inscription confirmée", intro, data),
    `Bonjour ${data.fullName}, votre inscription à "${data.sessionTitle}" est confirmée.`
  );
}

// Envoyé quand l'admin refuse l'inscription (session complète, profil non retenu…).
export async function sendSessionRegistrationRejectedEmail(data: SessionRegistrationMailData) {
  const intro =
    "Nous vous remercions vivement pour l'intérêt que vous portez à cette formation. " +
    "Malheureusement, nous ne sommes pas en mesure de retenir votre inscription pour cette session. " +
    "N'hésitez pas à nous recontacter : nous serons ravis de vous accueillir lors d'une prochaine session.";
  await sendMail(
    data.to,
    `Concernant votre inscription — ${data.sessionTitle}`,
    sessionRegistrationHtml("Votre inscription n'a pas pu être retenue", intro, data),
    `Bonjour ${data.fullName}, merci pour votre intérêt pour "${data.sessionTitle}". Nous ne sommes malheureusement pas en mesure de retenir votre inscription pour cette session. Nous serons ravis de vous accueillir lors d'une prochaine session.`
  );
}
