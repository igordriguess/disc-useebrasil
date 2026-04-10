import { useState } from "react";
import { toast } from "sonner";
import UserInfoForm from "@/components/UserInfoForm";
import DISCForm from "@/components/DISCForm";
import DISCResults from "../components/DISCResults";
import AdminDashboard from "@/components/AdminDashboard";
import type { DISCScores } from "@/components/DISCForm";
import type { UserInfo } from "@/components/UserInfoForm";
import UseeIcon from "@/components/UseeIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { hasDISCSubmissionForUser, saveDISCSubmission } from "@/lib/discStorage";

const ADMIN_USERNAME_HASH = "b88976e384cfba350b860fa35d2da623f6ff1c602647b49285de577681f7c894";
const ADMIN_PASSWORD_HASH = "5b9ccce4a61b723926e42217fed468ee5df71d20b403754dd091e4a90f907518";
const DUPLICATE_MESSAGE = "DISC já preenchido, entre em contato com o RH";

const hashSha256 = async (value: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const Index = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [scores, setScores] = useState<DISCScores | null>(null);
  const [userInfoError, setUserInfoError] = useState("");
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [isSavingAssessment, setIsSavingAssessment] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleReset = () => {
    setScores(null);
    setUserInfo(null);
    setUserInfoError("");
  };

  const handleStartAssessment = async (info: UserInfo) => {
    if (isCheckingDuplicate) return;

    setIsCheckingDuplicate(true);
    setUserInfoError("");
    try {
      if (await hasDISCSubmissionForUser(info)) {
        setUserInfoError(DUPLICATE_MESSAGE);
        return;
      }

      setUserInfo(info);
    } catch {
      toast.error("Não foi possível validar duplicidade agora.");
    } finally {
      setIsCheckingDuplicate(false);
    }
  };

  const handleCompleteAssessment = async (assessmentScores: DISCScores) => {
    if (!userInfo || isSavingAssessment) return;

    setIsSavingAssessment(true);
    try {
      const saveResult = await saveDISCSubmission(userInfo, assessmentScores);
      if (saveResult.status === "duplicate") {
        toast.error(DUPLICATE_MESSAGE);
        handleReset();
        return;
      }

      setScores(assessmentScores);
      window.scrollTo({ top: 0, behavior: "smooth" });
      toast.success(`Avaliação salva em ${saveResult.entry.fileName}.`);
    } catch {
      toast.error("Não foi possível salvar a avaliação no diretório local.");
    } finally {
      setIsSavingAssessment(false);
    }
  };

  const handleBackToUserInfo = () => {
    setUserInfo(null);
    setUserInfoError("");
  };

  const handleAdminLogin = async () => {
    if (isAuthenticating) return;

    setIsAuthenticating(true);
    try {
      const normalizedUsername = adminUsername.trim();

      const [usernameHash, passwordHash] = await Promise.all([
        hashSha256(normalizedUsername),
        hashSha256(adminPassword),
      ]);

      if (usernameHash !== ADMIN_USERNAME_HASH || passwordHash !== ADMIN_PASSWORD_HASH) {
        toast.error("Credenciais inválidas.");
        return;
      }

      setAdminDialogOpen(false);
      setAdminUsername("");
      setAdminPassword("");
      handleReset();
      setIsAdminMode(true);
      toast.success("Login realizado com sucesso.");
    } catch {
      toast.error("Não foi possível validar o acesso.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleExitAdmin = () => {
    setIsAdminMode(false);
    toast.success("Sessão administrativa encerrada.");
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      {/* Background - logo-inspired smiley icons */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-[0.04]">
        <UseeIcon className="absolute top-[8%] left-[3%] w-36 h-36 text-primary" />
        <UseeIcon className="absolute top-[55%] right-[5%] w-52 h-52 text-primary" />
        <UseeIcon className="absolute bottom-[10%] left-[18%] w-28 h-28 text-primary" />
        <UseeIcon className="absolute top-[25%] right-[22%] w-24 h-24 text-primary rotate-12" />
        <UseeIcon className="absolute top-[75%] left-[55%] w-40 h-40 text-primary -rotate-6" />
        <UseeIcon className="absolute top-[3%] right-[40%] w-20 h-20 text-primary rotate-6" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 py-6">
        <div className="container mx-auto grid max-w-4xl grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div />

          <div className="flex items-center justify-center gap-3">
            <img src="/images/usee-logo.jpg" alt="Usee Brasil" className="h-10 w-10 rounded-xl" />
            <span className="text-xl font-bold gradient-text">Usee Brasil</span>
          </div>

          <div className="flex justify-end">
            {!isAdminMode ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAdminDialogOpen(true)}
                className="rounded-xl border-glass-border bg-secondary/50 text-foreground"
              >
                Entrar
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1">
        {isAdminMode ? (
          <AdminDashboard onExit={handleExitAdmin} />
        ) : scores && userInfo ? (
          <DISCResults scores={scores} userInfo={userInfo} onReset={handleReset} />
        ) : userInfo ? (
          <DISCForm
            onComplete={handleCompleteAssessment}
            onBackToUserInfo={handleBackToUserInfo}
            isSubmitting={isSavingAssessment}
          />
        ) : (
          <UserInfoForm
            onSubmit={handleStartAssessment}
            isSubmitting={isCheckingDuplicate}
            errorMessage={userInfoError}
          />
        )}
      </main>

      <Dialog
        open={adminDialogOpen}
        onOpenChange={(open) => {
          setAdminDialogOpen(open);
          if (!open) {
            setAdminUsername("");
            setAdminPassword("");
            setIsAuthenticating(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Acesso Administrador</DialogTitle>
            <DialogDescription>Acesso exclusivo do RH Usee Brasil.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="admin-username">Usuário</Label>
              <Input
                id="admin-username"
                value={adminUsername}
                onChange={(event) => setAdminUsername(event.target.value)}
                placeholder="Digite o usuário"
                autoComplete="username"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-password">Senha</Label>
              <Input
                id="admin-password"
                type="password"
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
                placeholder="Digite a senha"
                autoComplete="current-password"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleAdminLogin();
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdminDialogOpen(false)} disabled={isAuthenticating}>
              Cancelar
            </Button>
            <Button onClick={() => void handleAdminLogin()} disabled={isAuthenticating || !adminUsername.trim() || !adminPassword}>
              {isAuthenticating ? "Validando..." : "Entrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="relative z-10 px-4 pb-6 pt-2 text-center text-xs text-muted-foreground">
        <p>© 2026 Usee Brasil. Todos os direitos reservados.</p>
        <p className="mt-1">Desenvolvido com 💙 para os colaboradores da Usee Brasil</p>
      </footer>
    </div>
  );
};

export default Index;
