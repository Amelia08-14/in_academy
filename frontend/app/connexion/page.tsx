"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/app/components/Header";
import { ADMIN_ROLES } from "@/lib/auth";

type State = { errors?: { email?: string[]; password?: string[] }; message?: string } | undefined;

async function loginAction(redirectTo: string, _prev: State, formData: FormData): Promise<State> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email) return { errors: { email: ["Email requis"] } };
  if (!password) return { errors: { password: ["Mot de passe requis"] } };

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) return { message: data.error ?? "Identifiants incorrects" };

    // Cette page ne gère que les comptes particulier/entreprise du site.
    // L'administration a sa propre connexion, indépendante, sur /admin.
    if (ADMIN_ROLES.includes(data.role)) {
      return { message: "Compte administrateur : connectez-vous depuis /admin." };
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);
    localStorage.setItem("email", email);

    // On reste sur le site : le profil (particulier/entreprise) est accessible
    // depuis le menu du Header, pas via une redirection forcée vers un dashboard.
    // Sauf si on arrive ici via un lien d'inscription directe à une session (?redirect=...).
    window.location.href = redirectTo;
    return undefined;
  } catch {
    return { message: "Impossible de joindre le serveur." };
  }
}

export default function ConnexionPage() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const [state, action, pending] = useActionState(loginAction.bind(null, redirectTo), undefined);

  return (
    <>
      <Header />
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-card__title">Connexion</h1>
          <p className="auth-card__sub">Accédez à votre espace IN ACADEMY</p>

          {state?.message && <div className="auth-error">{state.message}</div>}

          <form action={action} className="auth-form" noValidate>
            <div className="auth-field">
              <label htmlFor="email" className="auth-label">Adresse email</label>
              <input
                id="email" name="email" type="email" autoComplete="email"
                placeholder="vous@exemple.com"
                className={`auth-input${state?.errors?.email ? " auth-input--error" : ""}`}
              />
              {state?.errors?.email && <span className="auth-field-error">{state.errors.email[0]}</span>}
            </div>

            <div className="auth-field">
              <label htmlFor="password" className="auth-label">Mot de passe</label>
              <input
                id="password" name="password" type="password" autoComplete="current-password"
                placeholder="••••••••"
                className={`auth-input${state?.errors?.password ? " auth-input--error" : ""}`}
              />
              {state?.errors?.password && <span className="auth-field-error">{state.errors.password[0]}</span>}
            </div>

            <button type="submit" className="btn btn--primary auth-submit" disabled={pending}>
              {pending ? "Connexion…" : "Se connecter"}
            </button>
          </form>

          <div className="auth-footer-links">
            <p className="auth-footer-link">
              Pas encore de compte ?{" "}
              <Link href={redirectTo !== "/" ? `/inscription?redirect=${encodeURIComponent(redirectTo)}` : "/inscription"}>
                Inscription particulier
              </Link>
              {" · "}
              <Link href="/inscription-entreprise">Compte entreprise</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
