import _ from "lodash";

import {
  HTML_DIR,
  ONE_JSON_PATH,
  getConfig,
  readJson,
  writeFile,
} from "./shared";

let config;

const makeChantHtml = async (chant, partTitle) => {
  const result = [];

  const push = (level, html) =>
    result.push(
      Array(level * 2)
        .fill(" ")
        .join("") + html
    );

  const pushTitle = (level) => {
    push(level, `<h1>${_.escape(partTitle)}</h1>`);
    push(level, `<h2>${_.escape(chant.title)}</h2>`);
  };

  const nodeOpen = (tag, node, extraAttrs = []) => {
    const attrs = [
      ...extraAttrs,
      node.lang ? ` ${node.lang}` : "",
      node.center ? " center" : "",
      node.right ? " right" : "",
      node.leader ? " leader" : "",
      node.id ? ` id="${node.id}"` : "",
    ].join("");
    return `<${tag}${attrs}>`;
  };

  const walkNode = (level, node) => {
    if (!_.isNil(node.html)) {
      if (node.type === "raw") {
        push(level, nodeOpen("chant", node, ` class="chant-raw"`));
        pushTitle(level + 1);
        node.html.split("\n").forEach((line) => push(level + 1, line));
        push(level, "</chant>");
      } else {
        let tag = node.type;
        if (tag.match(/^h\d$/)) tag = "h3";
        push(level, `${nodeOpen(tag, node)}${node.html}</${tag}>`);
      }
    } else if (node.children) {
      const tag = node.type;
      if ((tag === "group" && node.children.length == 1) || tag == "row") {
        const html = node.children
          .map(
            (node) => nodeOpen(node.type, node) + node.html + `</${node.type}>`
          )
          .join("");
        push(level, nodeOpen(tag, node) + html + `</${tag}>`);
      } else {
        push(level, nodeOpen(tag, node));
        if (node.type === "chant") pushTitle(level + 1);
        node.children.forEach((node) => walkNode(level + 1, node));
        push(level, `</${tag}>`);
      }
    } else {
      throw new Error(`Unexpected node in ${chant.id}`);
    }
  };

  push(
    0,
    config.header
      .replace("%TITLE%", _.escape(chant.title))
      .replace("style.css", "../style.css")
      .trim()
  );
  walkNode(2, chant);
  push(0, config.footer);
  await writeFile(`${HTML_DIR}/${chant.id}.html`, result.join("\n") + "\n");
};

const main = async () => {
  config = await getConfig();
  const { toc, chants } = await readJson(ONE_JSON_PATH);
  for (const chant of chants) {
    const partTitle = toc[chant.volume - 1].parts[chant.part - 1].title;
    await makeChantHtml(chant, partTitle);
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
