import { FormEvent, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/api/authApi";
import { toast } from "@/hooks/use-toast";
import { BarChart3, Shield, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import authHero from "@/assets/auth-hero.jpg";

const slides = [
  {
    icon: BarChart3,
    title: "Tableau de bord intelligent",
    description: "Visualisez vos finances en temps réel avec des graphiques interactifs et des indicateurs clés.",
  },
  {
    icon: Shield,
    title: "Gestion multi-modules",
    description: "Comptabilité, paie, trésorerie, ventes — tous vos outils financiers réunis en un seul endroit.",
  },
  {
    icon: Zap,
    title: "Pilotage budgétaire",
    description: "Suivez vos revenus, dépenses, prêts et investissements pour prendre les meilleures décisions.",
  },
];

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | undefined)?.from || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await signIn({ email, password });
      toast({ title: "Connexion réussie", description: "Bienvenue sur Pilgo." });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      console.error("Erreur de connexion.", error);
      toast({ title: "Erreur", description: "Email ou mot de passe invalide." });
    } finally {
      setSubmitting(false);
    }
  };

  const slide = slides[currentSlide];
  const SlideIcon = slide.icon;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left — Marketing */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={authHero} alt="Pilgo dashboard" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          {/* Logo top */}
          <div className="flex items-center gap-3">
            <img src="/pilgo-logo.png" alt="Pilgo" className="w-10 h-10 rounded-lg" />
            <span className="text-white font-bold text-xl tracking-tight">Pilgo</span>
          </div>

          {/* Slide content */}
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <SlideIcon className="text-emerald-400" size={24} />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">{slide.title}</h2>
            <p className="text-white/70 text-lg leading-relaxed">{slide.description}</p>

            {/* Dots + arrows */}
            <div className="flex items-center gap-4 mt-8">
              <button onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)} className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <div className="flex gap-2">
                {slides.map((_, i) => (
                  <button key={i} onClick={() => setCurrentSlide(i)} className={`h-1.5 rounded-full transition-all duration-500 ${i === currentSlide ? "w-8 bg-emerald-400" : "w-3 bg-white/30"}`} />
                ))}
              </div>
              <button onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)} className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Footer */}
          <p className="text-white/40 text-sm">© 2026 Pilgo — Pilotage budgétaire</p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <img src="/pilgo-logo.png" alt="Pilgo" className="w-10 h-10 rounded-lg" />
            <span className="font-bold text-xl text-foreground">Pilgo</span>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-foreground">Bon retour 👋</h1>
            <p className="text-muted-foreground mt-2">Connectez-vous pour accéder à votre espace de pilotage.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input id="email" type="email" placeholder="vous@exemple.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" placeholder="••••••••" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12" />
            </div>
            <div className="text-right">
              <Link to="/forgot-password" className="text-sm text-primary font-medium hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>
            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={submitting}>
              {submitting ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center">
            Pas encore de compte ?{" "}
            <Link to="/signup" className="text-primary font-medium hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
