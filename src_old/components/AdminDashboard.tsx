import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Eye, LogOut, RefreshCcw, Trash2 } from "lucide-react";
import DISCResults from "@/components/DISCResults";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  deleteDISCSubmission,
  getDISCSubmissions,
  type DISCSubmission,
} from "@/lib/discStorage";
import { toast } from "sonner";

interface AdminDashboardProps {
  onExit: () => void;
}

const AdminDashboard = ({ onExit }: AdminDashboardProps) => {
  const [entries, setEntries] = useState<DISCSubmission[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteEntry, setPendingDeleteEntry] = useState<DISCSubmission | null>(null);

  const selectedEntry = useMemo(
    () => (selectedId ? entries.find((entry) => entry.id === selectedId) ?? null : null),
    [entries, selectedId],
  );

  const refreshEntries = async (showToast = true) => {
    setIsLoading(true);
    try {
      const loadedEntries = await getDISCSubmissions();
      setEntries(loadedEntries);
      if (showToast) {
        toast.success("Lista de avaliações atualizada.");
      }
    } catch {
      toast.error("Não foi possível carregar as avaliações locais.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshEntries(false);
  }, []);

  const requestDelete = (entry: DISCSubmission) => {
    if (deletingId) return;
    setPendingDeleteEntry(entry);
  };

  const handleDelete = async () => {
    if (!pendingDeleteEntry || deletingId) return;

    const entry = pendingDeleteEntry;

    setDeletingId(entry.id);
    try {
      const deleted = await deleteDISCSubmission(entry.id);
      if (!deleted) {
        toast.error("Não foi possível excluir a avaliação.");
        return;
      }

      setEntries((prev) => prev.filter((item) => item.id !== entry.id));
      if (selectedId === entry.id) {
        setSelectedId(null);
      }

      toast.success("Avaliação excluída com sucesso.");
    } finally {
      setDeletingId(null);
      setPendingDeleteEntry(null);
    }
  };

  const deleteDialog = (
    <AlertDialog
      open={!!pendingDeleteEntry}
      onOpenChange={(open) => {
        if (!open && !deletingId) {
          setPendingDeleteEntry(null);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar exclusão da avaliação</AlertDialogTitle>
          <AlertDialogDescription>
            {pendingDeleteEntry ? (
              <>
                Você está prestes a excluir permanentemente a avaliação de
                <span className="font-semibold text-foreground"> {pendingDeleteEntry.userInfo.nome} {pendingDeleteEntry.userInfo.sobrenome}</span>
                .
                <br />
                Setor: {pendingDeleteEntry.userInfo.setor} • Data: {new Date(pendingDeleteEntry.createdAt).toLocaleString("pt-BR")}
              </>
            ) : (
              "Esta ação não pode ser desfeita."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={!!deletingId}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => void handleDelete()}
            disabled={!!deletingId}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deletingId ? "Excluindo..." : "Sim, excluir avaliação"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (selectedEntry) {
    return (
      <>
        <section className="py-8 md:py-10">
          <div className="container mx-auto max-w-4xl space-y-4 px-4">
            <div className="glass flex flex-wrap items-center justify-between gap-3 p-4">
              <Button
                variant="outline"
                onClick={() => setSelectedId(null)}
                className="rounded-xl border-glass-border bg-secondary/50 text-foreground"
              >
                <ArrowLeft size={16} className="mr-1" /> Voltar para lista
              </Button>

              <Button
                variant="destructive"
                onClick={() => requestDelete(selectedEntry)}
                className="rounded-xl"
                disabled={deletingId === selectedEntry.id}
              >
                <Trash2 size={16} className="mr-1" /> Excluir avaliação
              </Button>
            </div>
          </div>

          <DISCResults
            scores={selectedEntry.scores}
            userInfo={selectedEntry.userInfo}
            onReset={() => setSelectedId(null)}
            resetButtonLabel="Voltar para lista"
          />
        </section>
        {deleteDialog}
      </>
    );
  }

  return (
    <section className="py-10 md:py-16">
      <div className="container mx-auto max-w-4xl space-y-4 px-4">
        <div className="glass p-5 md:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold md:text-2xl">Painel do Administrador</h2>
              <p className="text-xs text-muted-foreground">Gerencie as avaliações DISC preenchidas.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => void refreshEntries()}
                className="rounded-xl border-glass-border bg-secondary/50 text-foreground"
                disabled={isLoading}
              >
                <RefreshCcw size={16} className="mr-1" /> Atualizar
              </Button>
              <Button variant="outline" onClick={onExit} className="rounded-xl border-glass-border bg-secondary/50 text-foreground">
                <LogOut size={16} className="mr-1" /> Sair
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-dashed border-glass-border bg-secondary/25 p-6 text-center text-sm text-muted-foreground">
              Carregando avaliações salvas localmente...
            </div>
          ) : entries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-glass-border bg-secondary/25 p-6 text-center text-sm text-muted-foreground">
              Nenhuma avaliação preenchida ainda.
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-glass-border/70 bg-secondary/25 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        {entry.userInfo.nome} {entry.userInfo.sobrenome}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.userInfo.idade} anos • {entry.userInfo.setor}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleString("pt-BR")}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedId(entry.id)}
                        className="rounded-xl border-glass-border bg-secondary/50 text-foreground"
                        disabled={!!deletingId}
                      >
                        <Eye size={16} className="mr-1" /> Visualizar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => requestDelete(entry)}
                        className="rounded-xl"
                        disabled={deletingId === entry.id}
                      >
                        <Trash2 size={16} className="mr-1" /> Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {deleteDialog}
    </section>
  );
};

export default AdminDashboard;
