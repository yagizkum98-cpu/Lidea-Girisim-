import fs from "node:fs";
import path from "node:path";

const switchSource = fs.readFileSync("components/LanguageSwitch.tsx", "utf8");
const dictionary = Object.fromEntries(
  [...switchSource.matchAll(/^\s*"((?:[^"\\]|\\.)+)":\s*"((?:[^"\\]|\\.)*)",?$/gm)].map(
    (match) => [match[1], match[2]],
  ),
);
const dictionaryEntries = Object.entries(dictionary).sort(
  ([left], [right]) => right.length - left.length,
);

function translate(value) {
  let result = value;
  for (const [source, target] of dictionaryEntries) {
    if (source.length >= 4 && result.includes(source)) result = result.split(source).join(target);
  }
  return result;
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(filePath);
    return entry.name.endsWith(".tsx") ? [filePath] : [];
  });
}

const sourceFiles = [...walk("app"), ...walk("components")].filter(
  (filePath) => !filePath.endsWith("LanguageSwitch.tsx"),
);
const untranslated = new Set();

for (const filePath of sourceFiles) {
  const source = fs.readFileSync(filePath, "utf8");
  for (const match of source.matchAll(/["'`](.{2,240}?)["'`]/gs)) {
    const value = match[1].replace(/\s+/g, " ").trim();
    if (!/[çğıİöşüÇĞÖŞÜ]/.test(value)) continue;
    if (value.includes("${") || value.includes("className")) continue;
    const translated = translate(value);
    if (/[çğıİöşüÇĞÖŞÜ]/.test(translated)) untranslated.add(`${value}\n  -> ${translated}`);
  }
}

console.log([...untranslated].sort((left, right) => left.localeCompare(right, "tr")).join("\n"));
