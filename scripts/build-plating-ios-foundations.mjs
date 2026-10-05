import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const outputPath = 'src/plating/ios-foundations.generated.json';
const sourcePaths = [
  'ios/TasteBuddy/DesignSystem/TBTheme.swift',
  'ios/TasteBuddy/Models/TasteModels.swift',
  'ios/TasteBuddy/DesignSystem/TasteBloomMotion.swift',
];
const fail = message => { throw new Error(message); };
const sameKeys = (actual, expected, context) => {
  if ([...actual].sort().join('|') !== [...expected].sort().join('|')) {
    fail(context + ': unexpected or missing members');
  }
};

// This is a strict parser for the source forms used by these foundations,
// not a Swift interpreter. Unsupported expressions stop generation.
function uncomment(source) {
  return source.replace(/"(?:\\.|[^"\\])*"|\/\/[^\n]*|\/\*[\s\S]*?\*\//g, token =>
    token.startsWith('"') ? token : token.replace(/[^\n]/g, ' '));
}

function block(source, header, context) {
  const matches = [...source.matchAll(new RegExp(header.source, 'g'))];
  if (matches.length !== 1) fail(context + ': expected one declaration');
  const match = matches[0];
  const start = match.index;
  const open = start + match[0].length - 1;
  let depth = 1;
  let quoted = false;
  for (let i = open + 1; i < source.length; i++) {
    if (quoted && source[i] === '\\') { i++; continue; }
    if (source[i] === '"') { quoted = !quoted; continue; }
    if (quoted) continue;
    if (source[i] === '{') depth++;
    if (source[i] === '}') {
      depth--;
      if (depth === 0) return { body: source.slice(open + 1, i), start, end: i + 1 };
    }
  }
  fail(context + ': unclosed declaration');
}

function enumBody(source, name) {
  return block(source, new RegExp('\\benum ' + name + '(?:\\s*:[^{]+)?\\s*\\{'), name).body;
}

function declarations(body, context) {
  const entries = body.trim().split('\n').filter(line => line.trim()).map(line => {
    const match = line.trim().match(/^static (?:let (\w+)(?:: (?:CGFloat|Int))? = (.+)|var (\w+): CGFloat \{ (.+) \})$/);
    if (!match) fail(context + ': unsupported declaration ' + line.trim());
    return { name: match[1] ?? match[3], expression: match[2] ?? match[4] };
  });
  if (new Set(entries.map(entry => entry.name)).size !== entries.length) fail(context + ': duplicate member');
  return entries;
}

function numeric(expression, lookup, context) {
  const terms = expression.split(/\s*\+\s*/);
  if (terms.length > 1) return terms.reduce((sum, term) => sum + numeric(term, lookup, context), 0);
  if (/^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(expression)) return Number(expression);
  if (/^(?:\w+\.)?\w+$/.test(expression)) return lookup(expression);
  fail(context + ': unsupported numeric expression ' + expression);
}

function splitArguments(source) {
  const result = [];
  let depth = 0;
  let quoted = false;
  let start = 0;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted && char === '\\') { i++; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (quoted) continue;
    if ('([{'.includes(char)) depth++;
    if (')]}'.includes(char)) depth--;
    if (depth < 0) fail('Unbalanced argument');
    if (char === ',' && depth === 0) { result.push(source.slice(start, i).trim()); start = i + 1; }
  }
  if (depth || quoted) fail('Unclosed argument');
  result.push(source.slice(start).trim());
  if (!result.at(-1)) result.pop();
  if (result.some(item => !item)) fail('Empty argument');
  return result;
}

function namedArguments(source, context) {
  const pairs = splitArguments(source).map(argument => {
    const match = argument.match(/^(\w+):\s*([\s\S]+)$/);
    if (!match) fail(context + ': unsupported argument ' + argument);
    return [match[1], match[2]];
  });
  if (new Set(pairs.map(([name]) => name)).size !== pairs.length) fail(context + ': duplicate argument');
  return Object.fromEntries(pairs);
}

function color(expression, lookup, context) {
  const opacity = expression.match(/^(.+)\.opacity\(([\d.]+)\)$/);
  if (opacity) {
    const base = color(opacity[1], lookup, context);
    const alpha = numeric(opacity[2], () => fail(context + ': invalid opacity'), context);
    if (alpha < 0 || alpha > 1) fail(context + ': opacity outside 0...1');
    return { hex: base.hex, alpha: base.alpha * alpha };
  }
  if (expression === 'Color.white' || expression === 'Color.black') {
    return { hex: expression === 'Color.white' ? '#FFFFFF' : '#000000', alpha: 1, alias: expression };
  }
  const literal = expression.match(/^Color\(hex: (0x[\dA-Fa-f]{6}|\w+)(?:, alpha: ([\d.]+))?\)$/);
  if (literal) {
    const raw = literal[1].startsWith('0x') ? literal[1] : lookup(literal[1]);
    if (typeof raw !== 'string' || !/^0x[\dA-Fa-f]{6}$/.test(raw)) fail(context + ': invalid hex ' + raw);
    const alpha = literal[2] === undefined ? 1 : numeric(literal[2], () => fail(context), context);
    if (alpha < 0 || alpha > 1) fail(context + ': alpha outside 0...1');
    return { hex: '#' + raw.slice(2).toUpperCase(), alpha };
  }
  if (/^\w+$/.test(expression)) {
    const resolved = lookup(expression);
    if (!resolved || typeof resolved !== 'object' || !resolved.hex) fail(context + ': invalid color alias');
    return { ...resolved, alias: expression };
  }
  fail(context + ': unsupported color expression ' + expression);
}

function cssColor({ hex, alpha }) {
  if (alpha === 1) return hex;
  const rgb = [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16));
  return 'rgba(' + rgb.join(', ') + ', ' + alpha + ')';
}

function cases(body, context) {
  const match = body.match(/^\s*((?:case [^\n]+\n\s*)+)/);
  if (!match) fail(context + ': missing cases');
  const names = match[1].trim().split('\n').flatMap(line =>
    line.trim().replace(/^case /, '').split(/,\s*/));
  if (names.some(name => !/^\w+$/.test(name)) || new Set(names).size !== names.length) fail(context + ': unsupported cases');
  return { names, rest: body.slice(match[0].length) };
}

function property(body, name, type) {
  return block(body, new RegExp('\\bvar ' + name + ': ' + type + '\\s*\\{'), name);
}

function switchValues(body, names, parse, context) {
  const selection = block(body, /switch self\s*\{/, context);
  if ((body.slice(0, selection.start) + body.slice(selection.end)).trim()) fail(context + ': unsupported switch wrapper');
  const values = new Map();
  let fallback;
  for (const line of selection.body.trim().split('\n').filter(line => line.trim())) {
    const match = line.trim().match(/^(case (?:\.\w+)(?:,\s*\.\w+)*|default): (.+)$/);
    if (!match) fail(context + ': unsupported branch ' + line.trim());
    const value = parse(match[2]);
    if (match[1] === 'default') {
      if (fallback !== undefined) fail(context + ': duplicate default');
      fallback = value;
    } else {
      for (const name of match[1].slice(5).split(/,\s*/).map(item => item.slice(1))) {
        if (!names.includes(name) || values.has(name)) fail(context + ': unknown or duplicate case ' + name);
        values.set(name, value);
      }
    }
  }
  return Object.fromEntries(names.map(name => {
    if (!values.has(name) && fallback === undefined) fail(context + ': missing case ' + name);
    return [name, values.has(name) ? values.get(name) : fallback];
  }));
}

function parseTheme(source) {
  const numbers = new Map();
  for (const name of ['TBSpacing', 'TBRadius', 'TBSize']) {
    numbers.set(name, declarations(enumBody(source, name), name));
  }
  let typographyBody = enumBody(source, 'TBTypography');
  for (const name of ['FontSize', 'Weight', 'LineHeight', 'LetterSpacing']) {
    const section = block(typographyBody, new RegExp('\\benum ' + name + '\\s*\\{'), name);
    numbers.set('TBTypography.' + name, declarations(section.body, name));
    typographyBody = typographyBody.slice(0, section.start) + typographyBody.slice(section.end);
  }
  if (typographyBody.trim()) fail('TBTypography: unsupported member');
  const active = new Set();
  const numberValue = (scope, name) => {
    const key = scope + '.' + name;
    if (active.has(key)) fail('Cyclic numeric alias ' + key);
    const entry = numbers.get(scope)?.find(item => item.name === name);
    if (!entry) fail('Unknown numeric alias ' + key);
    active.add(key);
    const value = numeric(entry.expression, reference => {
      const parts = reference.split('.');
      return parts.length === 1 ? numberValue(scope, reference) : numberValue(parts[0], parts[1]);
    }, key);
    active.delete(key);
    return value;
  };
  const values = scope => numbers.get(scope).map(({ name }) => ({ name, value: numberValue(scope, name) }));
  const weights = Object.fromEntries(values('TBTypography.Weight').map(({ name, value }) => [name, value]));
  const colorEntries = declarations(enumBody(source, 'TBColor'), 'TBColor');
  const colorActive = new Set();
  const resolveColor = name => {
    if (colorActive.has(name)) fail('Cyclic TBColor alias ' + name);
    const entry = colorEntries.find(item => item.name === name);
    if (!entry) fail('Unknown TBColor alias ' + name);
    colorActive.add(name);
    const result = color(entry.expression, resolveColor, 'TBColor.' + name);
    colorActive.delete(name);
    return result;
  };
  const colors = colorEntries.map(({ name }) => {
    const result = resolveColor(name);
    return { name, value: cssColor(result), ...(result.alias ? { alias: result.alias } : {}) };
  });

  const caps = {};
  const fontBody = enumBody(source, 'TBFont');
  const remainingFonts = fontBody.replace(/static func (\w+)\(_ size: CGFloat\) -> Font \{\s*\.custom\("([^"]+)", size: min\(size, (\d+(?:\.\d+)?)\)\)\s*\}/g,
    (_, name, family, cap) => {
      if (name in caps) fail('TBFont: duplicate function');
      caps[name] = Number(cap);
      return '';
    });
  if (remainingFonts.trim()) fail('TBFont: unsupported font implementation');
  sameKeys(Object.keys(caps), Object.keys(weights), 'TBFont weights');

  const roleCases = cases(enumBody(source, 'TBTextStyle'), 'TBTextStyle');
  let roleBody = roleCases.rest;
  const parts = {};
  for (const [name, type] of [['font', 'Font'], ['color', 'Color'], ['lineSpacing', 'CGFloat']]) {
    const section = property(roleBody, name, type);
    parts[name] = section.body;
    roleBody = roleBody.slice(0, section.start) + roleBody.slice(section.end);
  }
  if (roleBody.trim()) fail('TBTextStyle: unsupported member');
  const fonts = switchValues(parts.font, roleCases.names, expression => {
    const match = expression.match(/^TBFont\.(\w+)\((\d+(?:\.\d+)?)\)$/);
    if (!match || !(match[1] in caps)) fail('TBTextStyle: unsupported font ' + expression);
    return { size: Math.min(Number(match[2]), caps[match[1]]), weight: match[1] };
  }, 'TBTextStyle.font');
  const roleColors = switchValues(parts.color, roleCases.names, expression => {
    const match = expression.match(/^TBColor\.(\w+)$/);
    if (!match || !colorEntries.some(item => item.name === match[1])) fail('TBTextStyle: unknown color ' + expression);
    return match[1];
  }, 'TBTextStyle.color');
  const lineSpacing = switchValues(parts.lineSpacing, roleCases.names,
    expression => numeric(expression, () => fail('Unsupported role line spacing'), 'TBTextStyle.lineSpacing'), 'TBTextStyle.lineSpacing');
  return {
    colors,
    spacing: values('TBSpacing'),
    radius: values('TBRadius'),
    sizes: values('TBSize'),
    typography: {
      fontSizes: values('TBTypography.FontSize'),
      weights,
      lineHeights: values('TBTypography.LineHeight'),
      letterSpacing: values('TBTypography.LetterSpacing'),
      roles: roleCases.names.map(name => ({
        name, ...fonts[name], additionalLineSpacing: lineSpacing[name], color: roleColors[name],
      })),
    },
  };
}

function parseTastes(source) {
  const axis = enumBody(source, 'TasteAxis');
  const names = cases(axis, 'TasteAxis').names;
  const labels = switchValues(property(axis, 'label', 'String').body, names, expression => {
    if (!/^"(?:[^"\\]|\\.)*"$/.test(expression)) fail('TasteAxis.label: unsupported string');
    return JSON.parse(expression);
  }, 'TasteAxis.label');
  const paletteNames = switchValues(property(axis, 'palette', 'TasteAxisPalette').body, names, expression => {
    if (!/^\.\w+$/.test(expression)) fail('TasteAxis.palette: unsupported reference');
    return expression.slice(1);
  }, 'TasteAxis.palette');
  for (const [name, type, expected] of [
    ['mainColor', 'Color', 'palette.main'],
    ['tintSurfaceColor', 'Color', 'palette.tintSurface'],
    ['tintSurfaceTextColor', 'Color', 'palette.tintSurfaceText'],
    ['tintTextColor', 'Color', 'tintSurfaceTextColor'],
    ['gradientColors', '\\[Color\\]', 'palette.gradientColors'],
  ]) {
    if (property(axis, name, type).body.trim() !== expected) fail('TasteAxis.' + name + ': unsupported accessor');
  }
  const palette = block(source, /private extension TasteAxisPalette\s*\{/, 'TasteAxisPalette').body;
  const factory = block(palette, /static func make\([\s\S]*?\) -> TasteAxisPalette\s*\{/, 'TasteAxisPalette.make');
  const signature = palette.slice(factory.start, palette.indexOf('{', factory.start));
  const params = namedArguments(signature.slice(signature.indexOf('(') + 1, signature.lastIndexOf(')')), 'Palette parameters');
  if (Object.values(params).some(type => type !== 'UInt')) fail('Unsupported palette parameter type');
  const constructor = factory.body.trim().match(/^TasteAxisPalette\(([\s\S]*)\)$/);
  if (!constructor) fail('TasteAxisPalette.make: unsupported implementation');
  const fields = namedArguments(constructor[1], 'Palette fields');
  const members = block(source, /struct TasteAxisPalette: Equatable\s*\{/, 'TasteAxisPalette members').body.trim().split('\n').filter(line => line.trim()).map(line => {
    const match = line.trim().match(/^let (\w+): (Color|\[Color\])$/);
    if (!match) fail('Unsupported palette member ' + line.trim());
    return [match[1], match[2]];
  });
  sameKeys(Object.keys(fields), members.map(([name]) => name), 'Palette factory fields');
  const palettes = {};
  const declarationsBody = palette.slice(0, factory.start) + palette.slice(factory.end);
  const rest = declarationsBody.replace(/static let (\w+) = make\(([\s\S]*?)\)/g, (_, name, input) => {
    if (name in palettes) fail('Duplicate palette ' + name);
    const args = namedArguments(input, name);
    sameKeys(Object.keys(args), Object.keys(params), name + ' parameters');
    if (Object.values(args).some(value => !/^0x[\dA-Fa-f]{6}$/.test(value))) fail(name + ': unsupported hex argument');
    palettes[name] = Object.fromEntries(members.map(([field, type]) => {
      const expression = fields[field];
      const lookup = key => key in args ? args[key] : fail('Unknown palette argument ' + key);
      if (type === 'Color') return [field, cssColor(color(expression, lookup, name + '.' + field))];
      if (!expression.startsWith('[') || !expression.endsWith(']')) fail('Unsupported palette array');
      return [field, splitArguments(expression.slice(1, -1)).map(item => cssColor(color(item, lookup, name + '.' + field)))];
    }));
    return '';
  });
  if (rest.trim()) fail('TasteAxisPalette: unsupported declaration');
  sameKeys(Object.keys(palettes), names, 'Taste palettes');
  return names.map(id => {
    const selected = palettes[paletteNames[id]];
    if (!selected || selected.gradientColors.length !== 2) fail(id + ': expected a two-color palette gradient');
    return {
      id, label: labels[id], main: selected.main, tintSurface: selected.tintSurface,
      tintText: selected.tintSurfaceText, gradient: selected.gradientColors,
    };
  });
}

function parseControlFeedback(source) {
  const body = enumBody(source, 'TBControlFeedback');
  const constants = [...body.matchAll(/static let (\w+): CGFloat = (\d+(?:\.\d+)?)/g)];
  sameKeys(constants.map(match => match[1]), ['pressDistance', 'widthBasisDivisor', 'minimumBasis'], 'TBControlFeedback constants');
  const values = Object.fromEntries(constants.map(match => [match[1], Number(match[2])]));
  if (Object.values(values).some(value => value <= 0)) fail('Invalid press metric');
  const tone = enumBody(body, 'SurfaceTone');
  const opacity = tone.match(/var opacity: Double \{ self == \.primary \? ([\d.]+) : ([\d.]+) \}/);
  if (!opacity || !tone.includes('var color: Color { self == .primary ? .white : .black }')) fail('Unsupported press surface definition');
  const duration = enumBody(enumBody(source, 'TasteBloomMotion'), 'Duration').match(/static let press: Double = ([\d.]+)/);
  if (!duration) fail('Missing native press duration');
  return { ...values, primaryOpacity: Number(opacity[1]), neutralOpacity: Number(opacity[2]), durationMs: Number(duration[1]) * 1000 };
}

async function main() {
  if (process.argv.slice(2).some(argument => argument !== '--check') || process.argv.slice(2).length > 1) {
    fail('Usage: node scripts/build-plating-ios-foundations.mjs [--check]');
  }
  const rawSources = await Promise.all(sourcePaths.map(file => fs.readFile(path.join(root, file), 'utf8')));
  const result = {
    sources: sourcePaths.map((file, index) => ({
      path: file, sha256: createHash('sha256').update(rawSources[index]).digest('hex'),
    })),
    ...parseTheme(uncomment(rawSources[0])),
    tastes: parseTastes(uncomment(rawSources[1])),
    controlFeedback: parseControlFeedback(uncomment(rawSources[2])),
  };
  const serialized = JSON.stringify(result, null, 2) + '\n';
  if (process.argv.includes('--check')) {
    const existing = await fs.readFile(path.join(root, outputPath), 'utf8');
    if (existing !== serialized) fail(outputPath + ' is stale. Run node scripts/build-plating-ios-foundations.mjs');
    console.log('iOS foundations snapshot matches all Swift sources.');
  } else {
    await fs.writeFile(path.join(root, outputPath), serialized);
    console.log('Wrote ' + outputPath + ' from three Swift sources.');
  }
}

main().catch(error => {
  console.error('iOS foundations: ' + error.message);
  process.exitCode = 1;
});
