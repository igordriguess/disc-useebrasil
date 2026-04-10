import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { discQuestions, scaleLabels } from "@/data/discQuestions";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

export interface DISCScores {
  D: number;
  I: number;
  S: number;
  C: number;
}

interface DISCFormProps {
  onComplete: (scores: DISCScores) => void | Promise<void>;
  onBackToUserInfo: () => void;
  isSubmitting?: boolean;
}

const QUESTIONS_PER_PAGE = 5;

const DISCForm = ({ onComplete, onBackToUserInfo, isSubmitting = false }: DISCFormProps) => {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(discQuestions.length / QUESTIONS_PER_PAGE);
  const currentQuestions = discQuestions.slice(page * QUESTIONS_PER_PAGE, (page + 1) * QUESTIONS_PER_PAGE);
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / discQuestions.length) * 100;

  const allCurrentAnswered = currentQuestions.every((q) => answers[q.id] !== undefined);
  const allAnswered = answeredCount === discQuestions.length;

  const setAnswer = (id: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const calculateScores = (): DISCScores => {
    const raw = { D: 0, I: 0, S: 0, C: 0 };
    const counts = { D: 0, I: 0, S: 0, C: 0 };

    Object.entries(answers).forEach(([idStr, value]) => {
      const q = discQuestions.find((q) => q.id === Number(idStr));
      if (q) {
        raw[q.dimension] += value;
        counts[q.dimension]++;
      }
    });

    return {
      D: Math.round((raw.D / (counts.D * 5)) * 100),
      I: Math.round((raw.I / (counts.I * 5)) * 100),
      S: Math.round((raw.S / (counts.S * 5)) * 100),
      C: Math.round((raw.C / (counts.C * 5)) * 100),
    };
  };

  return (
    <section className="py-8 md:py-16">
      <div className="container mx-auto max-w-2xl px-4">
        <div className="text-center mb-8 space-y-2">
          <h2 className="text-xl md:text-2xl font-bold">
            Avaliação <span className="gradient-text">DISC</span>
          </h2>
          <p className="text-muted-foreground text-xs">
            Responda de acordo com seu comportamento no dia a dia.
          </p>
          <p className="text-muted-foreground text-xs">
            Não existe resposta certa ou errada, seja sincero(a) para obter resultados mais precisos.
          </p>
        </div>

        <div className="glass space-y-5 p-4 md:p-7">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progresso</span>
              <span>{answeredCount}/{discQuestions.length}</span>
            </div>
            <Progress value={progress} className="h-2 bg-secondary [&>div]:gradient-primary" />
          </div>

          <div className="space-y-6">
            {currentQuestions.map((q) => (
              <div key={q.id} className="space-y-2.5 animate-fade-in">
                <p className="text-sm font-medium text-foreground">
                  <span className="text-primary mr-2">{q.id}.</span>
                  {q.text}
                </p>
                <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                  {scaleLabels.map((label, idx) => {
                    const value = idx + 1;
                    const selected = answers[q.id] === value;
                    return (
                      <button
                        key={value}
                        onClick={() => setAnswer(q.id, value)}
                        className={`rounded-xl px-3 py-2 text-sm font-medium transition-all sm:w-auto sm:text-xs ${
                          selected
                            ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col-reverse gap-2 pt-3 sm:flex-row sm:items-center sm:justify-between">
            {page === 0 ? (
              <Button
                variant="outline"
                onClick={onBackToUserInfo}
                className="w-full rounded-xl border-glass-border bg-secondary/50 text-foreground sm:w-auto"
              >
                <ChevronLeft size={16} className="mr-1" /> Voltar
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setPage((p) => p - 1)}
                className="w-full rounded-xl border-glass-border bg-secondary/50 text-foreground sm:w-auto"
              >
                <ChevronLeft size={16} className="mr-1" /> Anterior
              </Button>
            )}

            {page < totalPages - 1 ? (
              <Button
                onClick={() => setPage((p) => p + 1)}
                disabled={!allCurrentAnswered}
                className="gradient-primary w-full rounded-xl text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto"
              >
                Próximo <ChevronRight size={16} className="ml-1" />
              </Button>
            ) : (
              <Button
                onClick={() => void onComplete(calculateScores())}
                disabled={!allAnswered || isSubmitting}
                className="gradient-primary w-full rounded-xl text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto"
              >
                <CheckCircle2 size={16} className="mr-1" /> {isSubmitting ? "Salvando..." : "Finalizar"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DISCForm;
