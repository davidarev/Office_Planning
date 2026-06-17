/**
 * Seed idempotente de las mesas reales de la oficina (OP-221).
 *
 * Inserta o actualiza 7 mesas (MESA 1..7) según la disposición real recogida
 * en `.ai/assets/mapa_oficina.png`. Re-ejecutar el script no duplica registros
 * (usa upsert por `label`) y no toca reservas existentes.
 *
 * Coordenadas (x, y, width, height) en píxeles dentro de un lienzo lógico de
 * 900×600 px (DEFAULT_FLOOR_PLAN_WIDTH × DEFAULT_FLOOR_PLAN_HEIGHT). Son
 * aproximadas a partir del plano de referencia y se afinarán visualmente
 * cuando se integre `DeskItem` (OP-222).
 *
 * MESA 4 y MESA 6 son esquinadas (en L): se modelan con `cornerExtension`,
 * un segundo rectángulo solidario al principal — patrón introducido por
 * primera vez en este ticket (CLAUDE.md §15: simplicidad antes que
 * generalización prematura a polígonos).
 *
 * Uso: `npm run seed:tables` (requiere MONGODB_URI definido en `.env.local`).
 * El script de npm carga las variables de entorno con `--env-file=.env.local`.
 */

import mongoose from "mongoose";
import { connectDB } from "../src/lib/mongodb";
import Table from "../src/lib/models/table.model";
import type { TableType, TablePosition } from "../src/domain/types";

interface SeedTable {
  label: string;
  type: TableType;
  position: TablePosition;
}

const TABLES: SeedTable[] = [
  {
    label: "MESA 1",
    type: "blocked",
    position: { x: 60, y: 60, width: 110, height: 70, rotation: 0 },
  },
  {
    label: "MESA 2",
    type: "blocked",
    position: { x: 60, y: 160, width: 110, height: 70, rotation: 0 },
  },
  {
    label: "MESA 3",
    type: "preferential",
    position: { x: 260, y: 80, width: 140, height: 80, rotation: 0 },
  },
  {
    label: "MESA 4",
    type: "preferential",
    position: {
      x: 260,
      y: 220,
      width: 140,
      height: 80,
      rotation: 0,
      cornerExtension: {
        x: 380,
        y: 220,
        width: 60,
        height: 140,
        rotation: 0,
      },
    },
  },
  {
    label: "MESA 5",
    type: "flexible",
    position: { x: 500, y: 80, width: 140, height: 80, rotation: 0 },
  },
  {
    label: "MESA 6",
    type: "preferential",
    position: {
      x: 500,
      y: 220,
      width: 140,
      height: 80,
      rotation: 0,
      cornerExtension: {
        x: 620,
        y: 220,
        width: 60,
        height: 140,
        rotation: 0,
      },
    },
  },
  {
    label: "MESA 7",
    type: "flexible",
    position: { x: 720, y: 80, width: 140, height: 80, rotation: 0 },
  },
];

async function seed(): Promise<void> {
  await connectDB();

  let upserted = 0;
  let updated = 0;

  for (const t of TABLES) {
    const result = await Table.updateOne(
      { label: t.label },
      {
        $set: {
          type: t.type,
          position: t.position,
          isActive: true,
        },
        $setOnInsert: {
          label: t.label,
          assignedTo: null,
        },
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0) upserted += 1;
    else if (result.modifiedCount > 0) updated += 1;
  }

  console.log(
    `[seed-tables] Done. Upserted: ${upserted}, Updated: ${updated}, Total: ${TABLES.length}`
  );
}

seed()
  .catch((err) => {
    console.error("[seed-tables] Failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
