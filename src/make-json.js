import _ from "lodash";

import {
  JSON_DIR,
  PRE_HTML1_PATH,
  PRE_HTML2_PATH,
  getConfig,
  readFile,
  writeJson,
} from "./shared";

let config;

const detectLanguage = (line) => {
  const words = line
    .replace(/<[^>]+>/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z ]+/g, "")
    .split(/\s+/)
    .map((word) => word.toLowerCase())
    .filter((word) => !(word in config.ambiguousWords));
  const englishCount = words.reduce((count, word) => {
    const isEnglish =
      !(word in config.paliWords) && word in config.englishWords;
    return count + (isEnglish ? 1 : 0);
  }, 0);
  return englishCount >= words.length / 2 ? "en" : "pi";
};

const convertTables = (html, { stripTables = false } = {}) => {
  let table = null;
  let match;
  return html
    .trim()
    .split("\n")
    .map((line) => {
      if (line.match(/^<table/)) {
        table = [];
      } else if (line.match(/^<tbody/)) {
        //
      } else if (line.match(/^<tr/)) {
        table.push([]);
      } else if ((match = line.match(/^<td[^>]*>(?<inner>.*)<\/td>$/))) {
        table[table.length - 1].push(match.groups.inner);
      } else if (line.match(/<\/tr>$/)) {
        //
      } else if (line.match(/<\/tbody>$/)) {
        //
      } else if (line.match(/<\/table>$/)) {
        if (stripTables) {
          return table
            .flat()
            .filter((inner) => inner)
            .map((inner) => `<p>${inner}</p>`)
            .join("\n");
        } else {
          return table
            .map(
              (row, index) =>
                (index == 0 ? "<p>" : "") +
                row.join(" &amp; ") +
                (index < table.length - 1 ? "<br />" : "</p>")
            )
            .join("\n");
        }
      } else {
        return line;
      }
    })
    .filter((line) => line)
    .join("\n");
};

const cleanUpHtml = (html) =>
  html
    .replace(/<span class="underline">([^\/]+)<\/span>/g, "<u>$1</u>")
    .replace(/<a[^>]*>.+?<\/a>/g, "")
    .replace(/<span>(.*)<\/span>/g, "$1")
    .replace(/\[/g, "[ ")
    .replace(/\]/g, " ]");

const convertChant = (
  html,
  {
    id,
    lng = "mixed",
    splitAmp = false,
    splitParts = false,
    splitTitle = false,
    stripTables = false,
  } = {}
) => {
  let asideText = null;
  let groupLng = lng === "mixed" ? "pi" : lng;
  let firstHeading = true;
  let inAside = false;
  let inGroup = false;
  let title, match;

  const [volume, part] = id
    .match(/^ccb-(\d)\.(\d)/)
    .slice(1, 3)
    .map((s) => parseInt(s));
  let current = {
    volume,
    part,
    id,
    type: "chant",
    lang: lng,
    title: null,
    children: [],
  };

  const push = (node, force = false) => {
    if (force || lng === "mixed" || groupLng === lng) {
      current.children.push(node);
    }
  };

  const pushAside = (html) => push({ type: "aside", html });

  const pushGroup = () => {
    const attr = lng === "mixed" ? ` ${groupLng}` : "";
    const group = {
      type: "group",
      lang: lng === "mixed" ? groupLng : undefined,
      children: [],
      parent: current,
    };
    current.children.push(group);
    current = group;
  };

  const popGroup = () => {
    const group = current;
    current = current.parent;
    if (group.children.length > 0) {
      delete group.parent;
    } else {
      current.children.pop();
    }
  };

  const pushInner = (inner, single) => {
    let addLng = false;
    let html, children;
    const parts = inner.split(/ &amp; ?/);

    if (parts.length == 1) {
      html = parts[0];
    } else if (splitAmp) {
      if (single) pushGroup();
      for (const part of parts) {
        groupLng = detectLanguage(part);
        pushInner(part, false);
      }
      if (single) popGroup();
      return;
    } else if (splitParts) {
      const lngParts = parts.map((part) => detectLanguage(part));
      addLng = lng === "mixed" && !lngParts.every((l) => l === groupLng);
      push({
        type: "row",
        children: parts.map((html, index) => ({
          type: "verse",
          lang: addLng ? lngParts[index] : undefined,
          html: cleanUpHtml(html),
        })),
      });
      if (current.type === "group") {
        current.type = "grid";
      }
      if (addLng) delete current.lang;
      return;
    } else {
      html = parts.join(" ");
    }

    html = cleanUpHtml(html);
    const leader = html.match(/^\[ (Ha|No)/) ? true : undefined;

    if (single) {
      push({
        type: "group",
        children: [
          {
            type: "verse",
            leader,
            lang: !addLng && lng === "mixed" ? groupLng : undefined,
            html: html,
          },
        ],
      });
    } else {
      push({ type: "verse", leader, html });
    }
  };

  const asideRegex = new RegExp(
    `^<p>(?<inner>${config.asideMatchers.join("|")})(?<end><\/p>|<br \/>)$`
  );
  const lineRegex = /^(?:<(?:(?!span)(?<tag>[^ >]+))(?<unnumbered> class="unnumbered")?[^>]*>)?(?<inner>.+)<(?:\/(?<end>[^>]+)|(?<br>br) \/)>$/;

  convertTables(html, { stripTables })
    .split("\n")
    .forEach((line, index) => {
      const warn = (message) => {
        console.warn(`WARNING: ${message}`);
        console.warn(`         Line ${index + 1}: ${line}`);
      };
      if ((match = line.match(asideRegex))) {
        const { end, inner } = match.groups;
        if (end === "<br />") {
          asideText = inner;
          inAside = true;
        } else if (inner === "Solo introduction") {
          // Ugh, we have to do this exceptional case stuff...
          if ((lng === "en" && index == 1) || (lng === "pi" && index > 1)) {
            pushAside(inner);
          }
        } else {
          pushAside(inner);
        }
      } else if ((match = line.match(/^<!-- lng:(?<lng>.+) -->$/))) {
        groupLng = match.groups.lng;
      } else if (line.match(/^<\/?div/)) {
        // Ignore divs...
      } else if (line === "<p>" && !inGroup) {
        pushGroup();
        inGroup = true;
      } else if (line === "</p>" && inGroup) {
        popGroup();
        inGroup = false;
      } else if ((match = line.match(lineRegex))) {
        let { tag, unnumbered, inner, end, br } = match.groups;
        if (tag === 'u') {
          inner = '<u>' + inner;
          tag = undefined;
        }
        // These are to remove curly quotes, but it seems better to
        // leave them in as there are a lot of subtle rules regarding
        // which ones to use...
        // .replace(/[\u2018\u2019]/g, "'")
        // .replace(/[\u201C\u201D]/g, '"');
        if (tag && tag.match(/^h\d$/)) {
          let force, heading;
          const unTitle = _.unescape(inner);
          if (splitTitle) {
            if (lng !== detectLanguage(unTitle)) {
              return;
            }
            force = false;
            groupLng = detectLanguage(unTitle);
          } else {
            if (firstHeading) {
              force = true;
            } else {
              force = false;
              groupLng = unnumbered ? "pi" : "en";
            }
          }
          let hTag;
          if (firstHeading) {
            firstHeading = false;
            title = unTitle;
            hTag = "h1";
          } else {
            hTag = "h2";
          }
          heading = inner;
          if (current.children.length === 0) {
            current.title = _.unescape(heading);
          } else {
            push({ type: hTag, html: heading }, force);
          }
        } else if (tag === "p") {
          if (inGroup) {
            warn("Unexpected in group");
          }
          groupLng = detectLanguage(line);
          if (end === "p") {
            pushInner(inner, true);
            inGroup = false;
          } else if (br) {
            pushGroup();
            pushInner(inner, false);
            inGroup = true;
          } else {
            warn("Unexpected <p> line");
          }
        } else if (tag) {
          warn(`Unexpected tag ${tag}`);
        } else if (inAside) {
          asideText = asideText + " " + inner;
          if (!br) {
            pushAside(asideText);
            inAside = false;
            asideText = null;
            if (end !== "p") {
              warn(`Unexpected end tag ${end}`);
            }
          }
        } else if (inGroup) {
          pushInner(inner, false);
          if (!br) {
            if (end === "p") {
              popGroup();
              inGroup = false;
            } else {
              warn(`Unexpected end tag ${end}`);
            }
          }
        } else {
          warn("Expected inAside or inGroup");
        }
      } else {
        warn("Unexpected line");
      }
    });

  if (inGroup) popGroup();

  return current;
};

const convert = async (html, { id = "", lng = "mixed", ...options } = {}) => {
  id = `ccb-${id}`;
  const chant = convertChant(html, { ...options, id, lng });
  await writeJson(`${JSON_DIR}/${id}.json`, chant);
};

const split = (text, regex) => {
  const result = [];
  for (const line of text.trim().split("\n")) {
    if (!result.length || line.match(regex)) {
      result.push(line + "\n");
    } else {
      result[result.length - 1] += line + "\n";
    }
  }
  return result;
};

const main = async () => {
  config = await getConfig();
  const book1 = split(await readFile(PRE_HTML1_PATH), /^<h1/);
  const book2 = split(await readFile(PRE_HTML2_PATH), /^<h1/);

  let htmls, index;

  htmls = split(book1[1].replace(/<h1.+<\/h1>\n/, ""), /^<h2/);
  index = 1;
  for (const html of htmls) {
    await convert(html, {
      id: `1.1.${index}`,
      lng: "mixed",
    });
    index++;
  }

  let extra;
  htmls = split(book1[2].replace(/<h1.+<\/h1>\n/, ""), /^<h2/);
  [htmls[11], extra] = split(htmls[11], /^<p>Bow/);
  htmls[9] += extra;
  [htmls[13], extra] = split(htmls[13], /^<p>Bow/);
  htmls[11] += extra;
  [htmls[15], extra] = split(htmls[15], /^<p>Saṅ/);
  htmls[13] += extra;
  [htmls[16], extra] = split(htmls[16], /^<p>I am/);
  htmls[15] += extra;
  let piIndex = 1;
  let enIndex = 1;
  for (const html of htmls) {
    const lng = detectLanguage(html.split("\n")[1]);
    if (lng === "pi") {
      index = piIndex++;
    } else {
      index = enIndex++;
    }
    const id = `1.2.${lng === "pi" ? 1 : 2}.${index}`;
    await convert(html, { id: id, lng: lng });
  }

  htmls = split(
    book1[3]
      .replace(/<h1.+<\/h1>\n/, "")
      .replace(new RegExp(`<h2 id="[^"]+-1">[^<]+</h2>\n`, "g"), ""),
    /^<h2/
  );
  index = 1;
  for (const html of htmls) {
    if (index <= 5 && index != 2) {
      await convert(html, {
        id: `1.3.${index}.1`,
        lng: "pi",
      });
      await convert(html, {
        id: `1.3.${index}.2`,
        lng: "en",
      });
    } else {
      await convert(html, {
        id: `1.3.${index}`,
        lng: index == 6 ? "en" : "mixed",
        splitAmp: index >= 15,
        splitParts: index == 12,
      });
    }
    index++;
  }

  htmls = split(book1[4].replace(/<h1.+<\/h1>\n/, ""), /^<h2/);
  index = 1;
  for (const html of htmls) {
    await convert(html, {
      id: `1.4.${index}`,
      lng: "mixed",
      splitParts: index > 3,
      stripTables: index == 3,
    });
    index++;
  }

  htmls = split(
    book2[1].replace(/<h1.+<\/h1>\n/, ""),
    /^<h2.+?(Dhamma|Self|Sermon)<\/h2>$/
  );
  index = 1;
  for (const html of htmls) {
    await convert(html, {
      id: `2.1.${index}.2`,
      lng: "pi",
      splitParts: true,
      splitTitle: true,
    });
    await convert(html, {
      id: `2.1.${index}.1`,
      lng: "en",
      splitParts: true,
      splitTitle: true,
    });
    index++;
  }

  htmls = split(book2[2].replace(/<h1.+<\/h1>\n/, ""), /^<h2.+[^)]<\/h2>$/);
  index = 1;
  for (const html of htmls) {
    if (index == 25) {
      await convert(html, {
        id: `2.2.${index}.2`,
        lng: "pi",
        splitParts: true,
        splitTitle: true,
      });
      await convert(html, {
        id: `2.2.${index}.1`,
        lng: "en",
        splitParts: true,
        splitTitle: true,
      });
    } else {
      await convert(html, {
        id: `2.2.${index}`,
        lng: "pi",
        splitParts: true,
      });
    }
    index++;
  }

  htmls = split(book2[3].replace(/<h1.+<\/h1>\n/, ""), /^<h2/);
  index = 1;
  for (const html of htmls) {
    await convert(html, {
      id: `2.3.${index}`,
      lng: "pi",
    });
    index++;
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
