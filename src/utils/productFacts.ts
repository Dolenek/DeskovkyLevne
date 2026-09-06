import type { SupplementaryParameter } from "../types/product";
import type { Translator } from "../types/i18n";

const normalize = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_-]/g, " ");
const factKeys = {
  playersMin: /^(minimalni pocet hracu|min players|minimum players)$/,
  playersMax: /^(maximalni pocet hracu|max players|maximum players)$/,
  players: /^(pocet hracu|players|number of players)$/,
  timeMin: /^(minimalni herni doba|min playtime|minimum playtime)$/,
  timeMax: /^(maximalni herni doba|max playtime|maximum playtime)$/,
  time: /^(herni doba|doba hrani|delka hry|playtime|playing time)$/,
  age: /^(minimalni vek|min age|minimum age|vek|age|doporuceny vek)$/,
  language: /^(jazyk hry|game language|language|jazyk)$/,
  edition: /^(zakladni hra \/ rozsireni|base game \/ expansion)$/,
};
const valueFor = (parameters: SupplementaryParameter[], key: keyof typeof factKeys) =>
  parameters.find((parameter) => factKeys[key].test(normalize(parameter.name)))?.value;
const range = (min?: string, max?: string) =>
  min && max ? (min === max ? min : `${min}–${max}`) : min ? `${min}+` : max ? `≤ ${max}` : undefined;

export const productFacts = (
  parameters: SupplementaryParameter[],
  t: Translator,
): SupplementaryParameter[] => {
  const value = (key: keyof typeof factKeys) => valueFor(parameters, key);
  const facts = [
    ["detailPlayers", value("players") ?? range(value("playersMin"), value("playersMax"))],
    ["detailPlaytime", value("time") ?? range(value("timeMin"), value("timeMax"))],
    ["detailAge", value("age")],
    ["detailLanguage", value("language")],
  ];
  return facts.flatMap(([key, entry]) => (entry ? [{ name: t(key!), value: entry }] : []));
};

export const prioritizeParameters = (parameters: SupplementaryParameter[]): SupplementaryParameter[] => {
  const priority = (name: string) =>
    Object.values(factKeys).some((pattern) => pattern.test(normalize(name))) ? 0 : 1;
  return [...parameters].sort((left, right) => priority(left.name) - priority(right.name));
};
