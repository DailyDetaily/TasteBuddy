import { createHash } from "node:crypto";

export const hash = (value) =>
  createHash("sha256")
    .update(typeof value === "string" ? value : JSON.stringify(value))
    .digest("hex");
export const match = (text, regex, label) => {
  const value = text.match(regex);
  if (!value)
    throw new Error(`네이티브 동기화 규칙을 확인해야 합니다: ${label}`);
  return value;
};

// Balanced Swift declaration reader, ignoring braces inside strings and comments.
export function block(source, marker) {
  const at = source.indexOf(marker);
  if (at < 0) throw new Error(`네이티브 선언이 변경되었습니다: ${marker}`);
  const start = source.indexOf("{", at);
  let depth = 0,
    quoted = false,
    escaped = false,
    line = false,
    comment = 0;
  for (let i = start; i < source.length; i++) {
    const c = source[i],
      next = source[i + 1];
    if (line) {
      if (c === "\n") line = false;
      continue;
    }
    if (comment) {
      if (c === "/" && next === "*") {
        comment++;
        i++;
      } else if (c === "*" && next === "/") {
        comment--;
        i++;
      }
      continue;
    }
    if (quoted) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') quoted = false;
      continue;
    }
    if (c === "/" && next === "/") {
      line = true;
      i++;
      continue;
    }
    if (c === "/" && next === "*") {
      comment = 1;
      i++;
      continue;
    }
    if (c === '"') {
      quoted = true;
      continue;
    }
    if (c === "{") depth++;
    if (c === "}" && --depth === 0) return source.slice(start + 1, i);
  }
  throw new Error(`닫히지 않은 네이티브 선언: ${marker}`);
}

export function numberToken(sources, type, name, seen = []) {
  const key = `${type}.${name}`;
  if (seen.includes(key)) throw new Error(`순환 토큰: ${key}`);
  const source = Object.values(sources).find((s) =>
    s.includes(`enum ${type} {`),
  );
  if (!source) throw new Error(`숫자 토큰 타입 없음: ${type}`);
  const body = block(source, `enum ${type} {`);
  const expression = match(
    body,
    new RegExp(`static let ${name}(?:\\s*:[^=\\n]+)?\\s*=\\s*([^\\n]+)`),
    key,
  )[1]
    .split("//")[0]
    .trim();
  if (/^-?\d+(?:\.\d+)?$/.test(expression)) return Number(expression);
  const reference = expression.match(/^(\w+)\.(\w+)$/);
  if (reference)
    return numberToken(sources, reference[1], reference[2], [...seen, key]);
  throw new Error(
    `자동 계산을 지원하지 않는 숫자 토큰: ${key} = ${expression}`,
  );
}

export function themeColors(source) {
  const entries = [
    ...block(source, "enum TBColor {").matchAll(
      /static let (\w+)\s*=\s*([^\n]+)/g,
    ),
  ];
  const expressions = Object.fromEntries(
    entries.map((m) => [m[1], m[2].split("//")[0].trim()]),
  );
  const values = {};
  const resolve = (name) => {
    if (values[name]) return values[name];
    const expr = expressions[name];
    if (!expr) throw new Error(`색상 토큰 없음: ${name}`);
    let value;
    const hex = expr.match(
      /^Color\(hex: 0x([0-9a-f]+)(?:, alpha: ([\d.]+))?\)$/i,
    );
    const named = expr.match(
      /^Color\.(white|black)(?:\.opacity\(([\d.]+)\))?$/,
    );
    if (hex) value = cssHex(hex[1], hex[2]);
    else if (named)
      value = cssHex(named[1] === "white" ? "FFFFFF" : "000000", named[2]);
    else if (/^(?:TBColor\.)?\w+$/.test(expr))
      value = resolve(expr.replace("TBColor.", ""));
    else throw new Error(`자동 변환을 지원하지 않는 색상: ${name} = ${expr}`);
    values[name] = value;
    return value;
  };
  Object.keys(expressions).forEach(resolve);
  return values;
}
const cssHex = (hex, alpha) =>
  "#" +
  hex.toUpperCase().padStart(6, "0") +
  (alpha === undefined
    ? ""
    : Math.round(Number(alpha) * 255)
        .toString(16)
        .padStart(2, "0")
        .toUpperCase());

// Structure signatures retain modifiers/identifiers but ignore values that are
// explicitly exported. Unknown declarations remain hashed and require review.
export const structureSignature = (source) =>
  hash(
    source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/[^\n]*/g, "")
      .replace(/"(?:\\.|[^"\\])*"/g, '"<copy>"')
      .replace(/\b0x[\da-f]+\b|\b\d+(?:\.\d+)?\b/gi, "<number>")
      .replace(/\s+/g, ""),
  );
export const swiftString = (text, regex, label) =>
  JSON.parse('"' + match(text, regex, label)[1] + '"');

export const numberTokens = (text) => {
  const visible = text.replace(
    /"(?:\\.|[^"\\])*"|\/\/[^\n]*|\/\*[\s\S]*?\*\//g,
    (value) => " ".repeat(value.length),
  );
  return [...visible.matchAll(/\b0x[\da-f]+\b|\b\d+(?:\.\d+)?\b/gi)].map(
    (m) => ({ value: m[0], index: m.index }),
  );
};
