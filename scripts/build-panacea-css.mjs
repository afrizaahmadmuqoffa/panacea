/* One-off generator: scopes the reference CSS into the app.
   node scripts/build-panacea-css.mjs
   Input : references/panacea-landing/{styles,feed,auth}.css
   Output: components/panacea/panacea-chrome.css   (.panacea-site)
           app/[locale]/(public)/panacea-public.css (:is(.panacea-landing,.panacea-feed))
           app/[locale]/(public)/panacea-feed.css   (.panacea-feed)
           components/auth/panacea-auth.css         (.panacea-auth) */
import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";

const cwd = process.cwd();
const ref = (name) => path.join(cwd, "references", "panacea-landing", name);

const CHROME_PREFIXES = [
  ".site-header",
  ".site-footer",
  ".nav",
  ".brand",
  ".menu-toggle",
  ".button",
  ".footer-",
  ".skip-link",
  ".back-to-top",
  ".page-grain",
  ".wrap",
  ".online-dot",
];

const FEED_SKIP = [
  /^:root$/,
  /^\*$/,
  /^html$/,
  /^body/,
  /^a$/,
  /^button/,
  /^h1,h2,h3,p$/,
];

function isBaseSelector(sel) {
  return !(sel.startsWith(".") || sel.startsWith("#") || sel.startsWith(":") || sel.startsWith("&"));
}

function isChromeSelector(sel) {
  return CHROME_PREFIXES.some((p) => sel.startsWith(p)) || isBaseSelector(sel);
}

function prefixTree(node, classify) {
  if (node.type === "rule") {
    const scoped = node.selectors.map((sel) => {
      const scope = classify(sel.trim());
      return scope ? `${scope} ${sel.trim()}` : null;
    });
    if (scoped.some((s) => s === null)) {
      node.remove();
      return;
    }
    node.selectors = scoped;
  }
  node.each((child) => {
    if (child.type === "rule") {
      prefixTree(child, classify);
    } else if (child.type === "atrule" && (child.name === "media" || child.name === "supports")) {
      prefixTree(child, classify);
    }
  });
}

function renameKeyframeRefs(node, renamed) {
  if (renamed.size === 0) return;
  node.walkDecls(/^animation/, (decl) => {
    decl.value = decl.value.replace(/[A-Za-z_][\w-]*/g, (token) => renamed.get(token) ?? token);
  });
}

function rewriteFonts(cssText) {
  return cssText
    .replace(/--font-heading:\s*'Nunito'[^;]*;/, "--font-heading:var(--font-nunito),ui-sans-serif,sans-serif;")
    .replace(/--font-heading:\s*"Nunito"[^;]*;/, "--font-heading:var(--font-nunito),ui-sans-serif,sans-serif;")
    .replace(/--font-body:\s*'DM Sans'[^;]*;/, "--font-body:var(--font-dm-sans),ui-sans-serif,sans-serif;")
    .replace(/--font-body:\s*"DM Sans"[^;]*;/, "--font-body:var(--font-dm-sans),ui-sans-serif,sans-serif;");
}

function generateStyles() {
  const parsed = postcss.parse(fs.readFileSync(ref("styles.css"), "utf8"));

  const chromeClassify = (sel) => (sel === ":root" || sel.startsWith(":root") ? null : isChromeSelector(sel) ? ".panacea-site" : null);
  const publicClassify = (sel) =>
    sel.startsWith(":root") ? null : isChromeSelector(sel) ? null : ":is(.panacea-landing, .panacea-feed)";

  const chrome = postcss.root();
  const pub = postcss.root();

  parsed.each((child) => {
    if (child.type === "atrule" && child.name === "keyframes") {
      pub.append(child.clone());
      return;
    }
    if (child.type === "rule") {
      if (child.selectors[0]?.trim() === ":root") {
        const rootNode = child.clone();
        rootNode.selectors = [".panacea-site"];
        chrome.append(rootNode);
        return;
      }
      if (isChromeSelector(child.selectors[0].trim())) {
        const node = child.clone();
        prefixTree(node, chromeClassify);
        if (node.selectors) chrome.append(node);
      } else {
        const node = child.clone();
        prefixTree(node, publicClassify);
        if (node.selectors) pub.append(node);
      }
      return;
    }
    if (child.type === "atrule" && (child.name === "media" || child.name === "supports")) {
      const chromeNode = child.clone();
      prefixTree(chromeNode, chromeClassify);
      if (chromeNode.nodes?.length) chrome.append(chromeNode);
      const publicNode = child.clone();
      prefixTree(publicNode, publicClassify);
      if (publicNode.nodes?.length) pub.append(publicNode);
    }
  });

  const chromeCss = rewriteFonts(chrome.toString());
  const publicCss = rewriteFonts(pub.toString());
  fs.writeFileSync(path.join(cwd, "components/panacea/panacea-chrome.css"), chromeCss);
  fs.writeFileSync(path.join(cwd, "app/[locale]/(public)/panacea-public.css"), publicCss);
  console.log("chrome.css", chromeCss.length, "public.css", publicCss.length);
}

function generateFeed() {
  const parsed = postcss.parse(fs.readFileSync(ref("feed.css"), "utf8"));
  const out = postcss.root();
  const classify = (sel) => (sel.startsWith(":root") ? null : FEED_SKIP.some((re) => re.test(sel)) ? null : ".panacea-feed");
  const renamed = new Map();

  parsed.each((child) => {
    if (child.type === "atrule" && child.name === "keyframes") {
      const node = child.clone();
      node.params = `feed-${child.params}`;
      renamed.set(child.params, node.params);
      out.append(node);
      return;
    }
    if (child.type === "rule") {
      if (classify(child.selectors[0].trim()) === null) return;
      const node = child.clone();
      prefixTree(node, classify);
      if (node.selectors) out.append(node);
      return;
    }
    if (child.type === "atrule" && (child.name === "media" || child.name === "supports")) {
      const node = child.clone();
      prefixTree(node, classify);
      if (node.nodes?.length) out.append(node);
    }
  });

  renameKeyframeRefs(out, renamed);
  const text = rewriteFonts(out.toString());
  fs.writeFileSync(path.join(cwd, "app/[locale]/(public)/panacea-feed.css"), text);
  console.log("feed.css", text.length);
}

function generateAuth() {
  const parsed = postcss.parse(fs.readFileSync(ref("auth.css"), "utf8"));
  const out = postcss.root();
  const classify = () => ".panacea-auth";
  const renamed = new Map();

  parsed.each((child) => {
    if (child.type === "comment") return;
    if (child.type === "atrule" && child.name === "keyframes") {
      const node = child.clone();
      node.params = `auth-${child.params}`;
      renamed.set(child.params, node.params);
      out.append(node);
      return;
    }
    if (child.type === "rule" && child.selectors[0]?.trim() === ":root") {
      const rootNode = child.clone();
      rootNode.selectors = [".panacea-auth"];
      out.append(rootNode);
      return;
    }
    const node = child.clone();
    if (node.type !== "rule" && node.type !== "atrule") return;
    if (node.type === "rule" && node.selectors) {
      node.selectors = node.selectors.map((sel) => (sel.trim() === "html" || sel.trim().startsWith("body") ? ".panacea-auth" : sel));
    }
    prefixTree(node, classify);
    if (node.type === "rule" && node.selectors) out.append(node);
    else if (node.type === "atrule" && node.nodes?.length) out.append(node);
  });

  renameKeyframeRefs(out, renamed);
  const text = rewriteFonts(out.toString())
    .replace(/'Nunito'/g, "var(--font-nunito)")
    .replace(/'DM Sans'/g, "var(--font-dm-sans)");
  fs.writeFileSync(path.join(cwd, "components/auth/panacea-auth.css"), text);
  console.log("auth.css", text.length);
}

generateStyles();
generateFeed();
generateAuth();
