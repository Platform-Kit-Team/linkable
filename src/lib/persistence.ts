import type { BioModel } from "./model";
import { sanitizeModel, stableStringify } from "./model";
import { canUseGithubSync, pushCmsDataToGithub } from "./github";

const DEV_ENDPOINT = "/cms-data";
const PROD_ENDPOINT = "/data.json";

export type PersistResult = "dev" | "github" | "skipped";

export const fetchModel = async (): Promise<BioModel> => {
  const endpoint = import.meta.env.DEV ? DEV_ENDPOINT : PROD_ENDPOINT;
  const response = await fetch(endpoint, {
    headers: { Accept: "application/json" },
    cache: import.meta.env.DEV ? "no-store" : "default",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch CMS data: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  return sanitizeModel(payload);
};

export const persistModel = async (input: BioModel): Promise<PersistResult> => {
  const sanitized = sanitizeModel(input);
  const serialized = stableStringify(sanitized);

  if (import.meta.env.DEV) {
    await fetch(DEV_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: serialized,
    });
    return "dev";
  }

  if (!canUseGithubSync()) {
    throw new Error("Configure GitHub sync to save changes.");
  }

  await pushCmsDataToGithub(serialized);
  return "github";
};