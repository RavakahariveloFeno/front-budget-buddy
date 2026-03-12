import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset, resetPassword } from "@/api/authApi";
import { toast } from "@/hooks/use-toast";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const normalizedCode = useMemo(() => code.replace(/\s+/g, ""), [code]);

  const onRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      toast({ title: "Code envoyé", description: "Si l’email existe, un code a été envoyé." });
      setStep("reset");
    } catch (error) {
      console.error("Erreur mot de passe oublié.", error);
      toast({ title: "Erreur", description: error instanceof Error ? error.message : "Impossible d’envoyer le code." });
    } finally {
      setSubmitting(false);
    }
  };

  const onReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await resetPassword({ email, code: normalizedCode, newPassword });
      toast({ title: "Mot de passe modifié", description: "Vous pouvez vous connecter." });
      navigate("/signin", { replace: true });
    } catch (error) {
      console.error("Erreur réinitialisation mot de passe.", error);
      toast({ title: "Erreur", description: error instanceof Error ? error.message : "Réinitialisation impossible." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Mot de passe oublié</h1>
          <p className="text-muted-foreground">
            {step === "request" ? "Recevez un code par email." : "Saisissez le code et choisissez un nouveau mot de passe."}
          </p>
        </div>

        {step === "request" ? (
          <form onSubmit={onRequest} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input id="email" type="email" placeholder="vous@exemple.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12" />
            </div>
            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={submitting}>
              {submitting ? "Envoi..." : "Envoyer le code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={onReset} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input id="email" type="email" placeholder="vous@exemple.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12" disabled={submitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" inputMode="numeric" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} required className="h-12 tracking-widest text-center" disabled={submitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <Input id="newPassword" type="password" placeholder="••••••••" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="h-12" disabled={submitting} />
            </div>
            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={submitting || normalizedCode.length < 6}>
              {submitting ? "Validation..." : "Réinitialiser"}
            </Button>

            <div className="flex items-center justify-between gap-3">
              <Button type="button" variant="outline" className="h-10" disabled={submitting} onClick={() => requestPasswordReset(email)}>
                Renvoyer le code
              </Button>
              <Button type="button" variant="ghost" className="h-10" disabled={submitting} onClick={() => setStep("request")}>
                Retour
              </Button>
            </div>
          </form>
        )}

        <p className="text-sm text-muted-foreground text-center">
          <Link to="/signin" className="text-primary font-medium hover:underline">
            Revenir à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}

