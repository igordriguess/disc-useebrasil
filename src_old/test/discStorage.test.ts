import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteDISCSubmission,
  getDISCSubmissions,
  hasDISCSubmissionForUser,
  saveDISCSubmission,
} from "@/lib/discStorage";

describe("discStorage", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("saves submission through local API", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          entry: {
            id: "joao_silva_32_rh",
            fileName: "Joao_Silva_32_RH.json",
            createdAt: "2026-04-09T00:00:00.000Z",
            userInfo: { nome: "Joao", sobrenome: "Silva", idade: "32", setor: "RH" },
            scores: { D: 80, I: 65, S: 55, C: 40 },
          },
        }),
        { status: 201 },
      ),
    );

    const result = await saveDISCSubmission(
      {
        nome: "Joao",
        sobrenome: "Silva",
        idade: "32",
        setor: "RH",
      },
      { D: 80, I: 65, S: 55, C: 40 },
    );

    expect(result.status).toBe("saved");

    if (result.status === "saved") {
      expect(result.entry.fileName).toBe("Joao_Silva_32_RH.json");
      expect(result.entry.id).toBe("joao_silva_32_rh");
    }
  });

  it("blocks duplicate answers for same person", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: "duplicate" }), { status: 409 }));

    const second = await saveDISCSubmission(
      {
        nome: "Maria",
        sobrenome: "Souza",
        idade: "28",
        setor: "Marketing",
      },
      { D: 70, I: 30, S: 45, C: 55 },
    );

    expect(second.status).toBe("duplicate");
  });

  it("checks existence and deletion through API", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ exists: true }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ deleted: true }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ entries: [] }), { status: 200 }));

    const exists = await hasDISCSubmissionForUser({
      nome: "Paula",
      sobrenome: "Lima",
      idade: "25",
      setor: "SAC",
    });

    expect(exists).toBe(true);
    const firstRequestUrl = String(fetchMock.mock.calls[0]?.[0] ?? "");
    expect(firstRequestUrl).toContain("/api/submissions/exists?");
    expect(firstRequestUrl).toContain("nome=Paula");
    expect(firstRequestUrl).toContain("sobrenome=Lima");
    expect(firstRequestUrl).toContain("idade=25");
    expect(firstRequestUrl).toContain("setor=SAC");

    const deleted = await deleteDISCSubmission("paula_lima");
    expect(deleted).toBe(true);

    const entries = await getDISCSubmissions();
    expect(entries).toHaveLength(0);
  });
});
