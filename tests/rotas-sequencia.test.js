import test from "node:test";
import assert from "node:assert/strict";
import { calcularSequenciasPendentes } from "../src/lib/rotasSequencia.js";

test("normaliza as sequências pendentes sem mexer nos visitados", () => {
  const itens = [
    {
      id: 1,
      status: "VISITADO",
      sequencia: 1,
      created_at: "2024-01-01T00:00:00Z",
    },
    {
      id: 2,
      status: "VISITADO",
      sequencia: 2,
      created_at: "2024-01-02T00:00:00Z",
    },
    {
      id: 3,
      status: "VISITADO",
      sequencia: 3,
      created_at: "2024-01-03T00:00:00Z",
    },
    {
      id: 4,
      status: "PENDENTE",
      sequencia: 4,
      created_at: "2024-01-04T00:00:00Z",
    },
    {
      id: 5,
      status: "PENDENTE",
      sequencia: 5,
      created_at: "2024-01-05T00:00:00Z",
    },
  ];

  const resultado = calcularSequenciasPendentes(itens, 0, 5);
  const pendentes = resultado
    .filter((item) => item.status === "PENDENTE")
    .sort((a, b) => a.sequencia - b.sequencia);

  assert.deepEqual(
    pendentes.map((item) => ({ id: item.id, sequencia: item.sequencia })),
    [
      { id: 5, sequencia: 4 },
      { id: 4, sequencia: 5 },
    ],
  );
});

test("normaliza os pendentes mesmo sem mudança de posição", () => {
  const itens = [
    {
      id: 1,
      status: "VISITADO",
      sequencia: 1,
      created_at: "2024-01-01T00:00:00Z",
    },
    {
      id: 2,
      status: "PENDENTE",
      sequencia: 1,
      created_at: "2024-01-02T00:00:00Z",
    },
    {
      id: 3,
      status: "PENDENTE",
      sequencia: 2,
      created_at: "2024-01-03T00:00:00Z",
    },
  ];

  const resultado = calcularSequenciasPendentes(itens, -1, -1);
  const pendentes = resultado
    .filter((item) => item.status === "PENDENTE")
    .sort((a, b) => a.sequencia - b.sequencia);

  assert.deepEqual(
    pendentes.map((item) => ({ id: item.id, sequencia: item.sequencia })),
    [
      { id: 2, sequencia: 2 },
      { id: 3, sequencia: 3 },
    ],
  );
});

test("mantém a sequência inicial quando a posição escolhida é a mesma", () => {
  const itens = [
    {
      id: 1,
      status: "PENDENTE",
      sequencia: 1,
      created_at: "2024-01-01T00:00:00Z",
    },
    {
      id: 2,
      status: "PENDENTE",
      sequencia: 2,
      created_at: "2024-01-02T00:00:00Z",
    },
  ];

  const resultado = calcularSequenciasPendentes(itens, 0, 1);

  assert.deepEqual(
    resultado.map((item) => ({ id: item.id, sequencia: item.sequencia })),
    [
      { id: 1, sequencia: 1 },
      { id: 2, sequencia: 2 },
    ],
  );
});
