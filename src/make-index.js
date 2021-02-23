import _ from "lodash";

import {
  INDEX_PATH,
  ONE_JSON_PATH,
  getConfig,
  readJson,
  writeFile,
} from "./shared";

let config;

const main = async () => {
  config = await getConfig();
  const { toc } = await readJson(ONE_JSON_PATH);

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

  push(2, `<h1>Community Chanting Book</h1>`);
  push(2, `<h2>`);
  push(3, `Everything in one file`);
  push(3, `[<a href="ccb.html">html</a>]`);
  push(3, `[<a href="ccb.json">json</a>]`);
  push(2, `</h2>`);

  toc.forEach((tocVolume) => {
    push(2, `<h3>${_.escape(tocVolume.title)}</h3>`);
    tocVolume.parts.forEach((tocPart) => {
      push(2, `<h4>${_.escape(tocPart.title)}</h4>`);
      push(2, `<ul>`);
      tocPart.chants.forEach((tocChant) => {
        push(3, `<li>`);
        push(4, _.escape(tocChant.title));
        push(4, `[<a href="html/${tocChant.link}.html">html</a>]`);
        push(4, `[<a href="json/${tocChant.link}.json">json</a>]`);
        push(3, `</li>`);
      });
      push(2, `</ul>`);
    });
  });

  const year = new Date().getFullYear();
  push(2, `<p class="copyright">Copyright © ${config.copyright} ${year}</p>`);

  push(0, config.footer);

  await writeFile(INDEX_PATH, result.join("\n") + "\n");
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
