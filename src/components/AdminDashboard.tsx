import { KeyboardEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, LogOut, RefreshCcw, Search, Trash2 } from "lucide-react";
import DISCResults from "@/components/DISCResults";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

type DiscKey = keyof DISCSubmission["scores"];
type SortColumn = "nome" | DiscKey | "predominante";
type SortDirection = "asc" | "desc";

const DISC_KEYS: DiscKey[] = ["D", "I", "S", "C"];

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const formatScore = (value: number) => `${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;

const getRankedProfiles = (scores: DISCSubmission["scores"]) =>
  DISC_KEYS.map((key) => ({ key, value: scores[key] })).sort((a, b) => b.value - a.value);

const getDominantProfile = (scores: DISCSubmission["scores"]) => getRankedProfiles(scores)[0];

const AdminDashboard = ({ onExit }: AdminDashboardProps) => {
  const [entries, setEntries] = useState<DISCSubmission[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteEntry, setPendingDeleteEntry] = useState<DISCSubmission | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>("nome");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const selectedEntry = useMemo(
    () => (selectedId ? entries.find((entry) => entry.id === selectedId) ?? null : null),
    [entries, selectedId],
  );

  const filteredEntries = useMemo(() => {
    const term = normalizeText(searchTerm);

    if (!term) {
      return entries;
    }

    return entries.filter((entry) =>
      normalizeText(`${entry.userInfo.nome} ${entry.userInfo.sobrenome}`).includes(term),
    );
  }, [entries, searchTerm]);

  const sortedEntries = useMemo(() => {
    const factor = sortDirection === "asc" ? 1 : -1;

    return [...filteredEntries].sort((a, b) => {
      const aName = normalizeText(`${a.userInfo.nome} ${a.userInfo.sobrenome}`);
      const bName = normalizeText(`${b.userInfo.nome} ${b.userInfo.sobrenome}`);

      if (sortColumn === "nome") {
        return aName.localeCompare(bName, "pt-BR") * factor;
      }

      if (sortColumn === "predominante") {
        const aProfiles = getRankedProfiles(a.scores);
        const bProfiles = getRankedProfiles(b.scores);

        const firstLetterDiff = aProfiles[0].key.localeCompare(bProfiles[0].key, "pt-BR") * factor;
        if (firstLetterDiff !== 0) {
          return firstLetterDiff;
        }

        const secondLetterDiff = aProfiles[1].key.localeCompare(bProfiles[1].key, "pt-BR") * factor;
        if (secondLetterDiff !== 0) {
          return secondLetterDiff;
        }

        return aName.localeCompare(bName, "pt-BR") * factor;
      }

      const scoreDiff = (a.scores[sortColumn] - b.scores[sortColumn]) * factor;
      if (scoreDiff !== 0) {
        return scoreDiff;
      }

      return aName.localeCompare(bName, "pt-BR") * factor;
    });
  }, [filteredEntries, sortColumn, sortDirection]);

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

  const handleRowKeyDown = (event: KeyboardEvent<HTMLElement>, entryId: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelectedId(entryId);
    }
  };

  const handleSearch = () => {
    setSearchTerm(searchInput);
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortColumn(column);
    setSortDirection(column === "nome" ? "asc" : "desc");
  };

  const getSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) {
      return null;
    }

    return sortDirection === "asc" ? (
      <ChevronUp size={12} className="text-emerald-400" aria-hidden="true" />
    ) : (
      <ChevronDown size={12} className="text-emerald-400" aria-hidden="true" />
    );
  };

  const getSortButtonClassName = (column: SortColumn) =>
    `inline-flex items-center gap-1 transition-colors ${sortColumn === column ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"}`;

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
                {[
                  pendingDeleteEntry.userInfo.setor?.trim() ? `Setor: ${pendingDeleteEntry.userInfo.setor.trim()}` : "",
                  `Data: ${new Date(pendingDeleteEntry.createdAt).toLocaleString("pt-BR")}`,
                ].filter(Boolean).join(" • ")}
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
          <div className="container mx-auto max-w-7xl space-y-4 px-4">
            <div className="glass flex flex-col gap-2 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
              <Button
                variant="outline"
                onClick={() => setSelectedId(null)}
                className="w-full rounded-xl border-glass-border bg-secondary/50 text-foreground sm:w-auto"
              >
                <ArrowLeft size={16} className="mr-1" /> Voltar para lista
              </Button>

              <Button
                variant="destructive"
                onClick={() => requestDelete(selectedEntry)}
                className="w-full rounded-xl sm:w-auto"
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
            containerClassName="max-w-7xl"
          />
        </section>
        {deleteDialog}
      </>
    );
  }

  return (
    <section className="py-8 md:py-16">
      <div className="container mx-auto max-w-7xl space-y-4 px-4">
        <div className="glass p-4 md:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold md:text-2xl">Painel do Administrador</h2>
              <p className="text-xs text-muted-foreground">Gerencie as avaliações DISC preenchidas.</p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
              <Button
                variant="outline"
                onClick={() => void refreshEntries()}
                className="w-full rounded-xl border-glass-border bg-secondary/50 text-foreground sm:w-auto"
                disabled={isLoading}
              >
                <RefreshCcw size={16} className="mr-1" /> Atualizar
              </Button>
              <Button variant="outline" onClick={onExit} className="w-full rounded-xl border-glass-border bg-secondary/50 text-foreground sm:w-auto">
                <LogOut size={16} className="mr-1" /> Sair
              </Button>
            </div>
          </div>

          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <Input
              value={searchInput}
              onChange={(event) => {
                const nextValue = event.target.value;
                setSearchInput(nextValue);
                setSearchTerm(nextValue);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSearch();
                }
              }}
              placeholder="Digite um nome para pesquisar"
              className="h-10 border-glass-border bg-secondary/25 text-foreground placeholder:text-muted-foreground"
            />
            <Button
              variant="outline"
              onClick={handleSearch}
              className="w-full rounded-xl border-glass-border bg-secondary/50 text-foreground sm:w-auto"
            >
              <Search size={16} className="mr-1" /> Pesquisar
            </Button>
          </div>

          {searchTerm.trim() && (
            <p className="mb-3 text-xs text-muted-foreground">
              Resultado da busca por <span className="font-semibold text-foreground">"{searchTerm.trim()}"</span>: {filteredEntries.length} registro(s).
            </p>
          )}

          {isLoading ? (
            <div className="rounded-xl border border-dashed border-glass-border bg-secondary/25 p-6 text-center text-sm text-muted-foreground">
              Carregando avaliações salvas localmente...
            </div>
          ) : entries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-glass-border bg-secondary/25 p-6 text-center text-sm text-muted-foreground">
              Nenhuma avaliação preenchida ainda.
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-glass-border bg-secondary/25 p-6 text-center text-sm text-muted-foreground">
              Nenhum colaborador encontrado para a pesquisa informada.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-glass-border/70 bg-secondary/20">
              <Table className="w-full table-auto">
                <TableHeader className="bg-secondary/40">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-foreground whitespace-nowrap">
                      <button type="button" className={getSortButtonClassName("nome")} onClick={() => handleSort("nome")}>
                        Nome {getSortIndicator("nome")}
                      </button>
                    </TableHead>
                    <TableHead className="text-foreground whitespace-nowrap">
                      <button type="button" className={getSortButtonClassName("D")} onClick={() => handleSort("D")}>
                        D {getSortIndicator("D")}
                      </button>
                    </TableHead>
                    <TableHead className="text-foreground whitespace-nowrap">
                      <button type="button" className={getSortButtonClassName("I")} onClick={() => handleSort("I")}>
                        I {getSortIndicator("I")}
                      </button>
                    </TableHead>
                    <TableHead className="text-foreground whitespace-nowrap">
                      <button type="button" className={getSortButtonClassName("S")} onClick={() => handleSort("S")}>
                        S {getSortIndicator("S")}
                      </button>
                    </TableHead>
                    <TableHead className="text-foreground whitespace-nowrap">
                      <button type="button" className={getSortButtonClassName("C")} onClick={() => handleSort("C")}>
                        C {getSortIndicator("C")}
                      </button>
                    </TableHead>
                    <TableHead className="text-foreground whitespace-nowrap">
                      <button type="button" className={getSortButtonClassName("predominante")} onClick={() => handleSort("predominante")}>
                        Predominante {getSortIndicator("predominante")}
                      </button>
                    </TableHead>
                    <TableHead className="text-right text-foreground whitespace-nowrap">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedEntries.map((entry) => {
                    const rankedProfiles = getRankedProfiles(entry.scores);
                    const dominant = rankedProfiles[0];
                    const support = rankedProfiles[1];

                    return (
                      <TableRow
                        key={entry.id}
                        className="cursor-pointer border-glass-border/70 odd:bg-secondary/20 even:bg-secondary/30 hover:bg-secondary/45"
                        onClick={() => setSelectedId(entry.id)}
                        onKeyDown={(event) => handleRowKeyDown(event, entry.id)}
                        role="button"
                        tabIndex={0}
                      >
                        <TableCell className="py-3">
                          <p className="text-sm font-semibold text-foreground">
                            {entry.userInfo.nome} {entry.userInfo.sobrenome}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {new Date(entry.createdAt).toLocaleString("pt-BR")}
                          </p>
                        </TableCell>
                        <TableCell className="py-3 text-xs font-semibold text-foreground/90 whitespace-nowrap">{formatScore(entry.scores.D)}</TableCell>
                        <TableCell className="py-3 text-xs font-semibold text-foreground/90 whitespace-nowrap">{formatScore(entry.scores.I)}</TableCell>
                        <TableCell className="py-3 text-xs font-semibold text-foreground/90 whitespace-nowrap">{formatScore(entry.scores.S)}</TableCell>
                        <TableCell className="py-3 text-xs font-semibold text-foreground/90 whitespace-nowrap">{formatScore(entry.scores.C)}</TableCell>
                        <TableCell className="py-3 whitespace-nowrap">
                          <span className="text-sm font-bold text-emerald-400">{dominant.key}</span>
                          <span className="mx-1 text-xs text-muted-foreground">/</span>
                          <span className="text-sm font-semibold text-sky-400" title="Fator de apoio">
                            {support.key}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 text-right whitespace-nowrap">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              requestDelete(entry);
                            }}
                            className="h-8 rounded-lg px-2"
                            disabled={deletingId === entry.id}
                            aria-label={`Excluir avaliação de ${entry.userInfo.nome} ${entry.userInfo.sobrenome}`}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
      {deleteDialog}
    </section>
  );
};

export default AdminDashboard;
