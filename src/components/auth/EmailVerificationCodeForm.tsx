import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  email: string;
  disabled?: boolean;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack?: () => void;
};

export default function EmailVerificationCodeForm({ email, disabled, onVerify, onResend, onBack }: Props) {
  const [code, setCode] = useState("");
  const normalizedCode = useMemo(() => code.replace(/\s+/g, ""), [code]);

  const canSubmit = normalizedCode.length >= 6 && !disabled;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onVerify(normalizedCode);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Confirmez votre email</h2>
        <p className="text-muted-foreground">
          Un code de confirmation a été envoyé à <span className="font-medium text-foreground">{email}</span>.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="verificationCode">Code</Label>
          <Input
            id="verificationCode"
            inputMode="numeric"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={disabled}
            className="h-12 tracking-widest text-center"
          />
        </div>

        <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={!canSubmit}>
          Vérifier
        </Button>

        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="outline" className="h-10" disabled={disabled} onClick={() => onResend()}>
            Renvoyer le code
          </Button>
          {onBack ? (
            <Button type="button" variant="ghost" className="h-10" disabled={disabled} onClick={onBack}>
              Modifier l’email
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}

