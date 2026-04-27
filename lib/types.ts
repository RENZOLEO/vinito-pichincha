import type { Wine } from "@prisma/client";

export type WineListItem = Pick<
  Wine,
  "id" | "name" | "winery" | "category" | "varietal" | "zone" | "subZone" | "vintage" | "price" | "fichaUrl"
>;

export type WineDetail = Wine;

export type WinesResponse = {
  wines: WineListItem[];
  total: number;
  page: number;
};

export type ImportResult = {
  added: number;
  updated: number;
  errors: { row: number; message: string }[];
};
