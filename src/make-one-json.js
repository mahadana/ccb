import _ from "lodash";
import { StringDecoder } from "string_decoder";

import {
  JSON_DIR,
  ONE_JSON_PATH,
  PRE_TOC1_PATH,
  PRE_TOC2_PATH,
  getConfig,
  getSortedPaths,
  readFile,
  readJson,
  writeJson,
} from "./shared";

let config;

const getPdfToc = async () => {
  const pdfTocs = [
    await readFile(PRE_TOC1_PATH),
    await readFile(PRE_TOC2_PATH),
  ];
  return pdfTocs.map((pdfToc) => {
    const result = { parts: [], partsMap: {} };
    let recent, regex;
    if (pdfToc.trim()[0].match(/\||-/)) {
      // mupdf 1.17 or later...
      recent = true;
      regex = /^([-|])\s+(".+")\s+#(\d+)/;
    } else {
      // mupdf 1.14 or prior
      recent = false;
      regex = /^(\t)?(.+)\t#(\d+)/;
    }
    let lastPart;
    pdfToc
      .trim()
      .split("\n")
      .forEach((line) => {
        let match;
        if ((match = line.match(regex))) {
          let type, title;
          if (recent) {
            type = match[1] === "-" ? "part" : "chant";
            title = new StringDecoder("utf8").write(
              Buffer.from(eval(match[2]), "ascii")
            );
          } else {
            type = !match[1] ? "part" : "chant";
            title = match[2];
          }
          title = title.replace("'", "’").replace(/\b&/, " &");
          const page = parseInt(match[3]) - 8;
          if (type === "part") {
            lastPart = { title, page, chants: [], chantMap: {} };
            result.parts.push(lastPart);
            result.partsMap[title] = lastPart;
          } else {
            lastPart.chants.push({ title, page });
            lastPart.chantMap[title] = { title, page };
          }
        } else {
          throw new Error(`Wat? ${line}`);
        }
      });
    return result;
  });
};

const differentiateTitles = (items) => {
  for (let i = 0; i < items.length - 1; i++) {
    if (items[i].title === items[i + 1].title) {
      items[i].title += " (Pali)";
      items[i + 1].title += " (English)";
    }
  }
};

const getToc = (pdfToc, chants) =>
  config.volumes.map((configVolume, volumeIndex) => {
    volumeIndex += 1;
    const tocVolume = { volume: volumeIndex, ...configVolume, parts: [] };
    let partIndex = 0;
    let tocPart, pdfTocPart;

    chants.forEach((chant) => {
      if (chant.volume != volumeIndex) {
        return;
      } else if (
        chant.part > partIndex ||
        chant.id === "ccb-1.2.2.1" // Split Evening Chanting
      ) {
        partIndex = chant.part;
        pdfTocPart = pdfToc[volumeIndex - 1].parts[partIndex - 1];
        tocPart = {
          title: pdfTocPart.title,
          part: partIndex,
          page: pdfTocPart.page,
          chants: [],
        };
        if (!tocPart.title || !tocPart.page)
          throw new Error(`No title or page ${chant.title}`);
        tocVolume.parts.push(tocPart);
      }
      if (!tocPart || !pdfTocPart) throw new Error(`Unexpected`);
      const tocChat = {
        title: chant.title,
        lang: chant.lang,
        page: pdfTocPart.chantMap[chant.title].page,
        id: chant.id,
      };
      if (!tocChat.page) throw new Error(`No page ${chant.title}`);
      tocChat.page += config.pageOffsets[chant.id] || 0;
      tocPart.chants.push(tocChat);
      differentiateTitles(tocPart.chants);
    });

    differentiateTitles(tocVolume.parts);
    return tocVolume;
  });

const main = async () => {
  config = await getConfig();
  const pdfToc = await getPdfToc();
  const chants = [];
  for (const { path } of await getSortedPaths(JSON_DIR)) {
    const chant = await readJson(`${JSON_DIR}/${path}`);
    delete chant.copyright;
    delete chant.license;
    chants.push(chant);
  }
  const toc = getToc(pdfToc, chants);
  const oneJson = {
    copyright: config.copyright,
    license: config.license,
    toc,
    chants,
  };
  await writeJson(ONE_JSON_PATH, oneJson);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
