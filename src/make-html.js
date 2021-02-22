import _ from "lodash";

import {
  HTML_DIR,
  ONE_JSON_PATH,
  getConfig,
  readJson,
  writeFile,
} from "./shared";

let config;

const makeChantHtml = async (chant) => {
  const result = [];

  const push = (level, html) =>
    result.push(
      Array(level * 2)
        .fill(" ")
        .join("") + html
    );

  const nodeOpen = (tag, node) => {
    const attrs = [
      node.lang ? ` ${node.lang}` : "",
      node.leader ? " leader" : "",
      node.id ? ` id="${node.id}"` : "",
    ].join("");
    return `<${tag}${attrs}>`;
  };

  push(
    0,
    config.header
      .replace("%TITLE%", _.escape(chant.title))
      .replace("style.css", "../style.css")
      .trim()
  );
  push(2, nodeOpen("chant", chant));
  push(3, `<h1>${_.escape(chant.title)}</h1>`);

  chant.children.forEach((node, index) => {
    if (node.type === "group") {
      if (node.children.length == 1) {
        const verse = node.children[0];
        const html = nodeOpen("verse", verse) + verse.html + "</verse>";
        push(3, nodeOpen("group", node) + html + "</group>");
      } else {
        push(3, nodeOpen("group", node));
        node.children.forEach((node) =>
          push(4, nodeOpen("verse", node) + node.html + "</verse>")
        );
        push(3, "</group>");
      }
    } else if (node.type === "grid") {
      push(3, nodeOpen("grid", node));
      node.children.forEach((node) => {
        const html = node.children
          .map((node) => nodeOpen("verse", node) + node.html + "</verse>")
          .join("");
        push(4, nodeOpen("row", node) + html + "</row>");
      });
      push(3, "</grid>");
    } else {
      const tag = node.type[0] === "h" ? "h2" : node.type;
      push(3, `<${tag}>${node.html}</${tag}>`);
    }
  });

  push(2, "</chant>");
  push(0, config.footer);
  await writeFile(`${HTML_DIR}/${chant.id}.html`, result.join("\n") + "\n");
};

const main = async () => {
  config = await getConfig();
  const chanting = await readJson(ONE_JSON_PATH);
  for (const chant of chanting.chants) {
    await makeChantHtml(chant);
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
