import type { DISCScores } from "@/components/DISCForm";
import type { UserInfo } from "@/components/UserInfoForm";

const API_BASE = "/api";

export interface DISCSubmission {
  id: string;
  fileName: string;
  createdAt: string;
  userInfo: UserInfo;
  scores: DISCScores;
}

type SaveSubmissionResult =
  | { status: "saved"; entry: DISCSubmission }
  | { status: "duplicate" };

const fetchJson = async <T>(input: RequestInfo | URL, init?: RequestInit): Promise<{ status: number; data: T }> => {
  const response = await fetch(input, init);
  const data = (await response.json()) as T;
  return { status: response.status, data };
};

export const getDISCSubmissions = async () => {
  const { data } = await fetchJson<{ entries: DISCSubmission[] }>(`${API_BASE}/submissions`);
  return data.entries;
};

export const hasDISCSubmissionForUser = async (info: UserInfo) => {
  const params = new URLSearchParams({
    nome: info.nome,
    sobrenome: info.sobrenome,
    idade: info.idade,
    setor: info.setor,
  });

  const { data } = await fetchJson<{ exists: boolean }>(`${API_BASE}/submissions/exists?${params.toString()}`);
  return data.exists;
};

export const saveDISCSubmission = async (info: UserInfo, scores: DISCScores): Promise<SaveSubmissionResult> => {
  const { status, data } = await fetchJson<{ entry: DISCSubmission } | { error: string }>(`${API_BASE}/submissions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userInfo: info, scores }),
  });

  if (status === 409) {
    return { status: "duplicate" };
  }

  if (status >= 400 || !("entry" in data)) {
    throw new Error("Falha ao salvar avaliação.");
  }

  return { status: "saved", entry: data.entry };
};

export const deleteDISCSubmission = async (submissionId: string) => {
  const response = await fetch(`${API_BASE}/submissions/${encodeURIComponent(submissionId)}`, {
    method: "DELETE",
  });

  return response.ok;
};
