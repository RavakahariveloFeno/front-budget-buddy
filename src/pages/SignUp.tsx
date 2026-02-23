import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signUp } from "@/api/authApi";
import { toast } from "@/hooks/use-toast";

export default function SignUp() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await signUp({ firstName, lastName, email, password });
      await signIn({ email, password });
      toast({ title: "Compte cree", description: "Bienvenue sur Budget Buddy." });
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Erreur de creation de compte.", error);
      toast({ title: "Erreur", description: "Creation de compte impossible pour le moment." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "hsl(var(--background))" }}>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Inscription</CardTitle>
          <CardDescription>Creez votre compte pour commencer a gerer vos finances.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prenom</Label>
                <Input id="firstName" value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input id="lastName" value={lastName} onChange={(event) => setLastName(event.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Creation..." : "Creer mon compte"}
            </Button>
          </form>
          <p className="text-sm mt-4" style={{ color: "hsl(var(--muted-foreground))" }}>
            Deja inscrit ?{" "}
            <Link to="/signin" className="underline" style={{ color: "hsl(var(--primary))" }}>
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
