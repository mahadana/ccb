import _ from "lodash";

import {
  HTML_DIR,
  ONE_HTML_PATH,
  ONE_JSON_PATH,
  getConfig,
  getSortedPaths,
  readFile,
  readJson,
  writeFile,
} from "./shared";

let config;

const extractBody = (html) => {
  let stage = 0;
  return html
    .trim()
    .split("\n")
    .map((line) => {
      if (stage === 0 && line.match(/<body>/)) {
        stage = 1;
      } else if (stage === 1) {
        if (line.match(/^\s*<h1/)) {
          // Ignore
        } else if (line.match(/^\s*<\/body>/)) {
          stage = 2;
        } else {
          line = line.replace(
            /(<\/?h)(\d)>/g,
            (_, start, n) => `${start}${parseInt(n) + 1}>`
          );
          return line;
        }
      }
      return null;
    })
    .filter((line) => line !== null)
    .join("\n");
};

const main = async () => {
  config = await getConfig();
  const { toc } = await readJson(ONE_JSON_PATH);

  const htmls = {};
  for (const { path } of await getSortedPaths(HTML_DIR)) {
    const id = path.replace(/^(.+)\.html$/, "$1");
    const html = extractBody(await readFile(`${HTML_DIR}/${path}`));
    htmls[id] = html;
  }

  const result = [];

  const push = (level, html) =>
    result.push(
      Array(level * 2)
        .fill(" ")
        .join("") + html
    );

  push(
    0,
    config.header
      .replace("%TITLE%", "Community Chanting Book")
      .replace("<body>", '<body class="chant-onefile">')
      .trim()
  );

  toc.forEach((tocVolume) => {
    push(2, `<h1>${tocVolume.title}</h1>`);
    tocVolume.parts.forEach((tocPart) => {
      push(2, `<h2>${_.escape(tocPart.title)}</h2>`);
      tocPart.chants.forEach((tocChant) => {
        push(0, htmls[tocChant.id]);
      });
    });
  });

  push(0, config.footer);

  await writeFile(ONE_HTML_PATH, result.join("\n") + "\n");
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
