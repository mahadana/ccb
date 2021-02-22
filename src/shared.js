import { promises as fs } from "fs";
import glob from "glob-promise";
import yaml from "js-yaml";
import mkdirp from "mkdirp";
import { dirname, join, relative, resolve } from "path";

export const PROJECT_DIR = resolve(__dirname, "..");
export const CONFIG_PATH = join(PROJECT_DIR, "src", "config.yaml");

export const DIST_DIR = join(PROJECT_DIR, "dist");
export const HTML_DIR = join(DIST_DIR, "html");
export const INDEX_PATH = join(DIST_DIR, "index.html");
export const JSON_DIR = join(DIST_DIR, "json");
export const ONE_HTML_PATH = join(DIST_DIR, "ccb.html");
export const ONE_JSON_PATH = join(DIST_DIR, "ccb.json");

export const TMP_DIR = join(PROJECT_DIR, ".tmp");
export const ENGLISH_WORDS_PATH = join(
  TMP_DIR,
  "words",
  "words_dictionary.json"
);

export const PRE_DIR = join(TMP_DIR, "pre");
export const PRE_HTML1_PATH = join(PRE_DIR, "1.html");
export const PRE_HTML2_PATH = join(PRE_DIR, "2.html");
export const PRE_TOC1_PATH = join(PRE_DIR, "1.toc");
export const PRE_TOC2_PATH = join(PRE_DIR, "2.toc");

export const readFile = async (path) =>
  await fs.readFile(path, { encoding: "utf8" });

export const writeFile = async (path, text) => {
  await mkdirp(dirname(path));
  console.log(relative(PROJECT_DIR, path));
  await fs.writeFile(path, text, { encoding: "utf8" });
};

export const readJson = async (path) => JSON.parse(await readFile(path));

export const writeJson = async (path, data) =>
  await writeFile(path, JSON.stringify(data, null, 2) + "\n");

export const getConfig = async () => {
  const config = yaml.load(await readFile(CONFIG_PATH));
  config.englishWords = JSON.parse(await readFile(ENGLISH_WORDS_PATH));
  return config;
};

export const getSortedPaths = async (dir) =>
  (await glob("ccb-*", { cwd: dir }))
    .map((path) => {
      const key = path
        .match(/^ccb-(\d)\.(\d)(?:\.(\d+))?(?:\.(\d))?/)
        .slice(1)
        .map((part) => (part ? part.padStart(2, "0") : "00"))
        .join(".");
      return { key, path };
    })
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
    .map(({ key, path }) => {
      const [volume, part] = key.split(".").map((n) => parseInt(n));
      return { path, volume, part };
    });
