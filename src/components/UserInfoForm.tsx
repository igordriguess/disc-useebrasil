import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRight, Minus, Plus } from "lucide-react";

export interface UserInfo {
  nome: string;
  sobrenome: string;
  idade: string;
  setor: string;
}

const SETORES = ["Logística", "SAC", "Analista", "RH", "Marketing", "Financeiro", "Weesu", "Outro"];

interface UserInfoFormProps {
  onSubmit: (info: UserInfo) => void | Promise<void>;
  isSubmitting?: boolean;
  errorMessage?: string;
}

const UserInfoForm = ({ onSubmit, isSubmitting = false, errorMessage = "" }: UserInfoFormProps) => {
  const [info, setInfo] = useState<UserInfo>({ nome: "", sobrenome: "", idade: "", setor: "" });

  const updateAge = (value: string) => {
    const numericValue = value.replace(/\D/g, "");

    if (!numericValue) {
      setInfo((prev) => ({ ...prev, idade: "" }));
      return;
    }

    const clampedAge = Math.max(0, Math.min(120, Number.parseInt(numericValue, 10)));
    setInfo((prev) => ({ ...prev, idade: String(clampedAge) }));
  };

  const increaseAge = () => {
    const currentAge = Number.parseInt(info.idade || "0", 10);
    const nextAge = Number.isNaN(currentAge) ? 1 : Math.min(120, currentAge + 1);
    setInfo((prev) => ({ ...prev, idade: String(nextAge) }));
  };

  const decreaseAge = () => {
    const currentAge = Number.parseInt(info.idade || "0", 10);
    const nextAge = Number.isNaN(currentAge) ? 0 : Math.max(0, currentAge - 1);
    setInfo((prev) => ({ ...prev, idade: String(nextAge) }));
  };

  const isValid = info.nome.trim() && info.sobrenome.trim() && info.idade.trim() && info.setor;

  return (
    <section className="py-10 md:py-16">
      <div className="container mx-auto px-4 max-w-md">
        <div className="text-center mb-8 space-y-2">
          <h2 className="text-xl md:text-2xl font-bold">
            Seus <span className="gradient-text">Dados</span>
          </h2>
          <p className="text-muted-foreground text-xs">
            Preencha suas informações para iniciar a avaliação DISC.
          </p>
        </div>

        <div className="glass p-5 md:p-7 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Nome</label>
            <Input
              value={info.nome}
              onChange={(e) => setInfo({ ...info, nome: e.target.value })}
              placeholder="Seu nome"
              className="rounded-xl border-glass-border bg-secondary/50 text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Sobrenome</label>
            <Input
              value={info.sobrenome}
              onChange={(e) => setInfo({ ...info, sobrenome: e.target.value })}
              placeholder="Seu sobrenome"
              className="rounded-xl border-glass-border bg-secondary/50 text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Idade</label>
            <div className="relative">
              <Input
                type="number"
                min={0}
                max={120}
                value={info.idade}
                onChange={(e) => updateAge(e.target.value)}
                placeholder="Sua idade"
                className="rounded-xl border-glass-border bg-secondary/50 pr-14 text-foreground placeholder:text-muted-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <div className="absolute inset-y-1 right-1 flex w-12 gap-1">
                <button
                  type="button"
                  onClick={decreaseAge}
                  aria-label="Diminuir idade"
                  className="flex w-1/2 items-center justify-center rounded-lg bg-secondary/80 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Minus size={14} />
                </button>
                <button
                  type="button"
                  onClick={increaseAge}
                  aria-label="Aumentar idade"
                  className="flex w-1/2 items-center justify-center rounded-lg bg-secondary/80 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Setor</label>
            <div className="flex flex-wrap gap-2">
              {SETORES.map((s) => (
                <button
                  key={s}
                  onClick={() => setInfo({ ...info, setor: s })}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    info.setor === s
                      ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-xl border border-destructive/45 bg-destructive/15 px-3 py-2 text-xs font-medium text-red-400">
              {errorMessage}
            </div>
          ) : null}

          <div className="pt-3 flex justify-end">
            <Button
              onClick={() => void onSubmit(info)}
              disabled={!isValid || isSubmitting}
              className="gradient-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity"
            >
              {isSubmitting ? "Validando..." : "Iniciar Avaliação"} <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UserInfoForm;
