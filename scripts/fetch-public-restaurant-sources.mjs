import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';

const workspaceRoot = process.cwd();
const defaultConfigPath = path.join(
  workspaceRoot,
  'scripts',
  'config',
  'catchtable-target-restaurants.json',
);
const defaultOutputBase = path.join(workspaceRoot, 'tmp', 'public-sources');
const pdfExtractorScriptPath = path.join(workspaceRoot, 'scripts', 'extract-pdf-with-pdfkit.swift');
const visionOcrScriptPath = path.join(workspaceRoot, 'scripts', 'ocr-image-with-vision.swift');

function parseArgs(argv) {
  const positional = [];
  const options = {
    config: defaultConfigPath,
    restaurant: null,
    outDir: null,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg.startsWith('--config=')) {
      options.config = arg.slice('--config='.length).trim();
      continue;
    }

    if (arg === '--config') {
      options.config = argv[index + 1]?.trim() ?? options.config;
      index += 1;
      continue;
    }

    if (arg.startsWith('--restaurant=')) {
      options.restaurant = arg.slice('--restaurant='.length).trim();
      continue;
    }

    if (arg === '--restaurant') {
      options.restaurant = argv[index + 1]?.trim() ?? null;
      index += 1;
      continue;
    }

    if (arg.startsWith('--out-dir=')) {
      options.outDir = arg.slice('--out-dir='.length).trim();
      continue;
    }

    if (arg === '--out-dir') {
      options.outDir = argv[index + 1]?.trim() ?? null;
      index += 1;
      continue;
    }

    if (!arg.startsWith('--')) {
      positional.push(arg);
    }
  }

  if (!options.restaurant) {
    options.restaurant = positional[0] ?? null;
  }

  return options;
}

function printUsage() {
  console.log(`
Usage:
  node scripts/fetch-public-restaurant-sources.mjs <restaurant-key>
  node scripts/fetch-public-restaurant-sources.mjs --restaurant <restaurant-key>
  node scripts/fetch-public-restaurant-sources.mjs --restaurant la-yeon-seoul --config scripts/config/catchtable-target-restaurants.json

Examples:
  npm run public-source:fetch -- la-yeon-seoul
  npm run public-source:fetch -- restaurant-allen-seoul
`.trim());
}

function resolvePath(inputPath) {
  return path.isAbsolute(inputPath) ? inputPath : path.join(workspaceRoot, inputPath);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function slugify(value) {
  return `${value ?? ''}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function sanitizeFileName(value) {
  return `${value ?? ''}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

function collapseWhitespace(value) {
  return `${value ?? ''}`.replace(/\s+/g, ' ').trim();
}

function dedupeBy(items, keyGetter) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyGetter(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function buildMirrorUrl(url) {
  const stripped = `${url}`.trim().replace(/^https?:\/\//i, '');
  return `https://r.jina.ai/http://${stripped}`;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'text/markdown,text/plain;q=0.9,text/html;q=0.8,*/*;q=0.5',
      'User-Agent': 'TasteBuddyPublicSourceFetcher/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch "${url}" (${response.status} ${response.statusText}).`);
  }

  return response.text();
}

async function fetchBuffer(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/pdf,image/*,*/*;q=0.8',
      'User-Agent': 'TasteBuddyPublicSourceFetcher/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download "${url}" (${response.status} ${response.statusText}).`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function fetchViaMirror(url) {
  const mirrorUrl = buildMirrorUrl(url);
  try {
    const body = await fetchText(mirrorUrl);
    return {
      body,
      fetchedUrl: mirrorUrl,
      mirrorUrl,
      usedMirror: true,
    };
  } catch (mirrorError) {
    const body = await fetchText(url);
    return {
      body,
      fetchedUrl: url,
      mirrorUrl,
      usedMirror: false,
      mirrorError: mirrorError.message,
    };
  }
}

function extractPdfLinks(markdown) {
  const entries = [];
  const imageLinkedRegex = /!\[[^\]:]+:\s*([^\]]+?\.pdf)\]\([^)]*\)\]\((https?:\/\/[^)\s]+\.pdf)/gi;
  for (const match of `${markdown ?? ''}`.matchAll(imageLinkedRegex)) {
    entries.push({
      url: match[2],
      labelHint: normalizePdfTitle(match[1]),
    });
  }

  for (const match of `${markdown ?? ''}`.matchAll(/https?:\/\/[^)\s]+\.pdf/gi)) {
    entries.push({
      url: match[0],
      labelHint: null,
    });
  }

  return dedupeBy(entries, (entry) => entry.url.toLowerCase());
}

function normalizePdfTitle(value) {
  return collapseWhitespace(
    `${value ?? ''}`
      .replace(/\.pdf$/i, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' '),
  );
}

function runPdfExtraction(pdfPath, outputDir, baseName) {
  const stdout = execFileSync(
    '/usr/bin/swift',
    [
      pdfExtractorScriptPath,
      '--pdf',
      pdfPath,
      '--output-dir',
      outputDir,
      '--base-name',
      baseName,
    ],
    {
      cwd: workspaceRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  return JSON.parse(stdout);
}

function runVisionOCR(imagePath) {
  const stdout = execFileSync(
    '/usr/bin/swift',
    [visionOcrScriptPath, '--image', imagePath],
    {
      cwd: workspaceRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  return JSON.parse(stdout);
}

function extractContentSection(markdown) {
  const marker = '\nMarkdown Content:\n';
  const markerIndex = markdown.indexOf(marker);
  if (markerIndex >= 0) {
    return markdown.slice(markerIndex + marker.length);
  }
  return markdown;
}

function extractTitle(markdown, fallback) {
  const titleMatch = markdown.match(/^Title:\s*(.+)$/m);
  if (titleMatch) {
    return collapseWhitespace(titleMatch[1]);
  }

  const headingMatch = markdown.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    return collapseWhitespace(headingMatch[1]);
  }

  return fallback;
}

function extractPublishedTime(markdown) {
  const match = markdown.match(/^Published Time:\s*(.+)$/m);
  return match ? collapseWhitespace(match[1]) : null;
}

function isBlockedContent(markdown) {
  const normalized = `${markdown ?? ''}`.toLowerCase();
  return (
    normalized.includes('max challenge attempts exceeded') ||
    normalized.includes('javascript is disabled') ||
    normalized.includes('accountrequireshttps')
  );
}

function normalizeLine(line) {
  return collapseWhitespace(
    line
      .replace(/^\*+\s*/, '')
      .replace(/^\[\!\[[^\]]*\]\([^)]+\)\]\([^)]+\)/, '')
      .replace(/^#+\s*/, '')
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
      .replace(/^[-•]\s*/, ''),
  );
}

function isNoiseLine(line) {
  if (!line) {
    return true;
  }

  if (/^(title:|url source:|published time:|markdown content:)/i.test(line)) {
    return true;
  }

  if (/^(top of page|skip to content|to main content|more\.\.\.|use tab to navigate)/i.test(line)) {
    return true;
  }

  if (/^(login|join|logout|my page|my reservation|english|한국어|日本語|简体中文|membership|quickmenu|go)$/i.test(line)) {
    return true;
  }

  if (/^image \d+:/i.test(line)) {
    return true;
  }

  if (/^https?:\/\//i.test(line)) {
    return true;
  }

  if (/^[0-9]+$/.test(line)) {
    return true;
  }

  if (
    /^(shortcut to|the shilla seoul|accommodation|dining|retreat|meeting & event|gallery|hotel찾기|호텔찾기|권역별|브랜드별|print|dictionary|youtube|newsletter|home|culture|food & travel)$/i.test(
      line,
    )
  ) {
    return true;
  }

  if (
    /^(국내|서울 강북|서울 강남|전국|해외|중국|베트남|the shilla|shilla monogram|shilla stay|loading\.\.\.|facebook|twiter|talk|naver|share|tags|help-image|lock icon|korea joongang daily)$/i.test(
      line,
    )
  ) {
    return true;
  }

  return false;
}

function extractMeaningfulLines(markdown) {
  return extractContentSection(markdown)
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter((line) => !isNoiseLine(line));
}

function extractMeaningfulTextLines(text) {
  return `${text ?? ''}`
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter((line) => !isNoiseLine(line));
}

function looksLikeMenuHeading(line) {
  return (
    /\b(lunch|dinner)\b/i.test(line) ||
    /\b(course|menu)\b/i.test(line) ||
    /krw|₩/i.test(line) ||
    /점심상|저녁|디너|런치/.test(line)
  );
}

function looksLikeCourseLine(line) {
  if (!line || line.length > 80) {
    return false;
  }

  if (/^(about|team|reservation|contact|location|awards|collaboration|store)$/i.test(line)) {
    return false;
  }

  if (/^(main|dessert|pairing|price|supplement|reservation)$/i.test(line)) {
    return false;
  }

  if (/^[0-9,./ ()+-]+$/.test(line)) {
    return false;
  }

  return /[A-Za-z가-힣]/.test(line);
}

function extractImageAltDrafts(markdown) {
  return dedupeBy(
    [...extractContentSection(markdown).matchAll(/!\[[^\]:]+:\s*([^\]]+?)\]/g)]
      .map((match) => collapseWhitespace(match[1]))
      .filter(looksLikeCourseLine)
      .filter(
        (line) =>
          !/^(logo|기자 사진|print|facebook|twiter|talk|naver|share|tags|social-j|social-t|social-f|help-image|lock icon|국내|서울 강북|서울 강남|전국|해외|중국|베트남|the shilla|shilla monogram|shilla stay|loading\.\.\.|korea joongang daily)$/i.test(
            line,
          ),
      ),
    (line) => line.toLowerCase(),
  );
}

function extractCourseLineDrafts(lines, markdown, maxCount = 16) {
  const imageAltDrafts = extractImageAltDrafts(markdown);
  const combined = [...imageAltDrafts, ...lines.filter(looksLikeCourseLine)];
  return dedupeBy(combined, (line) => line.toLowerCase()).slice(0, maxCount);
}

function extractPdfCandidates(source, pdfRecord) {
  return pdfRecord.extraction.pages
    .map((page) => {
      const lines = Array.isArray(page.mergedLines) ? page.mergedLines : extractMeaningfulTextLines(page.text);
      const courseTitleDrafts = extractCourseLineDrafts(lines, page.text, 20);

      if (!courseTitleDrafts.length) {
        return null;
      }

      const menuType = detectMenuTypeFromLabel(pdfRecord.title);
      const menuTitle = pdfRecord.extraction.pages.length > 1
        ? `${pdfRecord.title} (page ${page.pageNumber})`
        : pdfRecord.title;

      return {
        menuType,
        menuTitle,
        priceLabel: null,
        priceValue: null,
        courseTitleDrafts,
        sourceLabel: pdfRecord.label,
        sourceType: 'pdf_menu',
        url: pdfRecord.url,
        seasonLabel: source.seasonLabel ?? null,
        localImageRelativePath: path.relative(workspaceRoot, page.imagePath),
        pageNumber: page.pageNumber,
      };
    })
    .filter(Boolean);
}

function detectMenuTypeFromLabel(value) {
  const lower = `${value ?? ''}`.toLowerCase();
  if (lower.includes('lunch') || lower.includes('점심') || lower.includes('런치')) {
    return 'lunch';
  }
  if (lower.includes('dinner') || lower.includes('저녁') || lower.includes('디너')) {
    return 'dinner';
  }
  return 'other';
}

function extractMenuCandidates(source, lines, markdown) {
  const candidates = [];

  if (Array.isArray(source.referenceMenus) && source.referenceMenus.length > 0) {
    source.referenceMenus.forEach((referenceMenu) => {
      candidates.push({
        menuType: referenceMenu.menuType ?? source.menuType ?? 'other',
        menuTitle: referenceMenu.menuTitle ?? referenceMenu.title ?? source.label,
        priceLabel: referenceMenu.priceLabel ?? null,
        priceValue: referenceMenu.priceValue ?? null,
        courseTitleDrafts: Array.isArray(referenceMenu.courseTitleDrafts)
          ? referenceMenu.courseTitleDrafts
          : source.captureCourseLines
            ? extractCourseLineDrafts(lines, markdown)
            : [],
        sourceLabel: source.label,
        sourceType: source.sourceType,
        url: source.url,
        seasonLabel: referenceMenu.seasonLabel ?? source.seasonLabel ?? null,
      });
    });

    return candidates;
  }

  if (source.menuType || source.createReferenceMenu) {
    candidates.push({
      menuType: source.menuType ?? 'other',
      menuTitle: source.referenceMenuTitle ?? source.label,
      priceLabel: null,
      priceValue: null,
      courseTitleDrafts: source.captureCourseLines ? extractCourseLineDrafts(lines, markdown) : [],
      sourceLabel: source.label,
      sourceType: source.sourceType,
      url: source.url,
      seasonLabel: source.seasonLabel ?? null,
    });
  }

  if (candidates.length > 0) {
    return candidates;
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!looksLikeMenuHeading(line)) {
      continue;
    }

    const windowLines = [];
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const nextLine = lines[cursor];
      if (looksLikeMenuHeading(nextLine) && windowLines.length > 0) {
        break;
      }
      if (looksLikeCourseLine(nextLine)) {
        windowLines.push(nextLine);
      }
      if (windowLines.length >= 12) {
        break;
      }
    }

    candidates.push({
      menuType: detectMenuTypeFromLabel(line),
      menuTitle: line,
      priceLabel: null,
      priceValue: null,
      courseTitleDrafts: dedupeBy(windowLines, (entry) => entry.toLowerCase()),
      sourceLabel: source.label,
      sourceType: source.sourceType,
      url: source.url,
      seasonLabel: source.seasonLabel ?? null,
    });
  }

  return dedupeBy(
    candidates.filter((candidate) => candidate.menuTitle),
    (candidate) => `${candidate.menuType}:${candidate.menuTitle}`.toLowerCase(),
  );
}

async function downloadPdfAssets(outputDir, source, markdown, sourceIndex) {
  const pdfLinks = extractPdfLinks(markdown);
  if (!pdfLinks.length) {
    return {
      documents: [],
      candidates: [],
    };
  }

  const pdfDir = path.join(outputDir, 'pdf-assets');
  ensureDir(pdfDir);

  const documents = [];
  const candidates = [];

  for (let index = 0; index < pdfLinks.length; index += 1) {
    const pdfLink = pdfLinks[index];
    const pdfUrl = pdfLink.url;
    const urlObject = new URL(pdfUrl);
    const fileName = path.basename(urlObject.pathname) || `menu-${index + 1}.pdf`;
    const normalizedBaseName = sanitizeFileName(fileName.replace(/\.pdf$/i, '')) || `menu-${index + 1}`;
    const prefix = `${String(sourceIndex).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`;
    const pdfPath = path.join(pdfDir, `${prefix}-${normalizedBaseName}.pdf`);
    const renderedDir = path.join(pdfDir, `${prefix}-${normalizedBaseName}`);
    const extractionPath = path.join(pdfDir, `${prefix}-${normalizedBaseName}.json`);

    const pdfBuffer = await fetchBuffer(pdfUrl);
    fs.writeFileSync(pdfPath, pdfBuffer);

    const extraction = runPdfExtraction(pdfPath, renderedDir, `${prefix}-${normalizedBaseName}`);
    fs.writeFileSync(extractionPath, `${JSON.stringify(extraction, null, 2)}\n`, 'utf8');

    const title = pdfLink.labelHint || normalizePdfTitle(decodeURIComponent(fileName));
    const pageDraftBundle = extraction.pages.map((page) => {
      const extractedLines = extractMeaningfulTextLines(page.text);
      const ocrResult = runVisionOCR(page.imagePath);
      const ocrLines = (ocrResult.lines ?? [])
        .map((entry) => normalizeLine(entry.text))
        .filter((line) => !isNoiseLine(line));
      const mergedLines = dedupeBy([...ocrLines, ...extractedLines], (line) => line.toLowerCase());
      return {
        ...page,
        ocrLines,
        mergedLines,
      };
    });
    const excerpt = pageDraftBundle
      .flatMap((page) => page.mergedLines)
      .slice(0, 10);
    const courseTitleDrafts = pageDraftBundle.flatMap((page) =>
      extractCourseLineDrafts(page.mergedLines, page.ocrLines.join('\n') || page.text, 12),
    );

    const pdfRecord = {
      label: `${source.label} PDF ${index + 1}`,
      title,
      url: pdfUrl,
      extraction: {
        ...extraction,
        pages: pageDraftBundle,
      },
    };

    documents.push({
      index: `${sourceIndex}.${index + 1}`,
      label: pdfRecord.label,
      sourceType: 'pdf_menu',
      url: pdfUrl,
      fetchedUrl: pdfUrl,
      mirrorUrl: null,
      usedMirror: false,
      mirrorError: null,
      trustScore: Math.min(0.99, (source.trustScore ?? 0.95) + 0.01),
      title,
      publishedTime: null,
      blocked: false,
      contentRelativePath: path.relative(workspaceRoot, extractionPath),
      excerpt,
      courseTitleDrafts,
      pdfRelativePath: path.relative(workspaceRoot, pdfPath),
      pageImageRelativePaths: extraction.pages.map((page) => path.relative(workspaceRoot, page.imagePath)),
    });

    candidates.push(...extractPdfCandidates(source, pdfRecord));
  }

  return {
    documents,
    candidates,
  };
}

function resolveRestaurant(restaurants, identifier) {
  const normalized = `${identifier ?? ''}`.trim().toLowerCase();
  return (
    restaurants.find((restaurant) => `${restaurant.canonicalSlug ?? ''}`.toLowerCase() === normalized) ??
    restaurants.find((restaurant) => `${restaurant.name ?? ''}`.toLowerCase() === normalized) ??
    restaurants.find((restaurant) =>
      (restaurant.slugCandidates ?? []).some((slug) => `${slug}`.toLowerCase() === normalized),
    ) ??
    null
  );
}

function buildManifest({
  restaurant,
  outputDir,
  sources,
  documents,
  menuCandidates,
}) {
  return {
    fetchedAt: new Date().toISOString(),
    restaurant: {
      slug: restaurant.canonicalSlug ?? slugify(restaurant.name),
      displayName: restaurant.name,
      chefName: restaurant.chefName,
      city: restaurant.city,
    },
    source: {
      mode: 'public_fallback',
      outputDirRelativePath: path.relative(workspaceRoot, outputDir),
      nextStep:
        'Review source snippets, copy verified menu/course lines into review-template rows, then generate intake CSVs or seed JSON.',
    },
    documents,
    menuCandidates,
    requestedSources: sources.map((source) => ({
      label: source.label,
      sourceType: source.sourceType,
      url: source.url,
      trustScore: source.trustScore ?? null,
      menuType: source.menuType ?? null,
      createReferenceMenu: source.createReferenceMenu ?? false,
    })),
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    process.exit(0);
  }

  if (!options.restaurant) {
    throw new Error('Restaurant identifier is required.');
  }

  const restaurants = readJson(resolvePath(options.config));
  const restaurant = resolveRestaurant(restaurants, options.restaurant);

  if (!restaurant) {
    throw new Error(`Restaurant "${options.restaurant}" was not found in the config.`);
  }

  if (!Array.isArray(restaurant.publicSources) || restaurant.publicSources.length === 0) {
    throw new Error(`Restaurant "${restaurant.name}" does not define any publicSources.`);
  }

  const canonicalSlug = restaurant.canonicalSlug ?? slugify(restaurant.name);
  const outputDir = resolvePath(options.outDir ?? path.join(defaultOutputBase, canonicalSlug));
  ensureDir(outputDir);

  const documents = [];
  const menuCandidates = [];

  for (let index = 0; index < restaurant.publicSources.length; index += 1) {
    const source = restaurant.publicSources[index];
    const fetchResult = await fetchViaMirror(source.url);
    const contentFileName = `${String(index + 1).padStart(2, '0')}-${sanitizeFileName(
      source.label,
    )}.md`;
    const contentPath = path.join(outputDir, contentFileName);
    fs.writeFileSync(contentPath, fetchResult.body, 'utf8');

    const blocked = isBlockedContent(fetchResult.body);
    const title = blocked ? source.label : extractTitle(fetchResult.body, source.label);
    const publishedTime = extractPublishedTime(fetchResult.body);
    const lines = blocked ? [] : extractMeaningfulLines(fetchResult.body);
    const courseTitleDrafts = blocked ? [] : extractCourseLineDrafts(lines, fetchResult.body);
    const candidateList = blocked ? [] : extractMenuCandidates(source, lines, fetchResult.body);
    const pdfAssets = blocked
      ? { documents: [], candidates: [] }
      : await downloadPdfAssets(outputDir, source, fetchResult.body, index + 1);

    documents.push({
      index: index + 1,
      label: source.label,
      sourceType: source.sourceType,
      url: source.url,
      fetchedUrl: fetchResult.fetchedUrl,
      mirrorUrl: fetchResult.mirrorUrl,
      usedMirror: fetchResult.usedMirror,
      mirrorError: fetchResult.mirrorError ?? null,
      trustScore: source.trustScore ?? null,
      title,
      publishedTime,
      blocked,
      contentRelativePath: path.relative(workspaceRoot, contentPath),
      excerpt: lines.slice(0, 10),
      courseTitleDrafts,
    });
    documents.push(...pdfAssets.documents);

    candidateList.forEach((candidate, candidateIndex) => {
      menuCandidates.push({
        id: `${canonicalSlug}-${String(index + 1).padStart(2, '0')}-${candidateIndex + 1}`,
        sourceIndex: index + 1,
        sourceLabel: source.label,
        sourceType: source.sourceType,
        sourceTitle: title,
        sourceUrl: source.url,
        menuType: candidate.menuType,
        menuTitle: candidate.menuTitle,
        priceLabel: candidate.priceLabel ?? null,
        priceValue: candidate.priceValue ?? null,
        seasonLabel: candidate.seasonLabel ?? publishedTime ?? null,
        courseTitleDrafts: candidate.courseTitleDrafts ?? [],
      });
    });
    pdfAssets.candidates.forEach((candidate, candidateIndex) => {
      menuCandidates.push({
        id: `${canonicalSlug}-${String(index + 1).padStart(2, '0')}-pdf-${candidateIndex + 1}`,
        sourceIndex: index + 1,
        sourceLabel: candidate.sourceLabel,
        sourceType: candidate.sourceType,
        sourceTitle: title,
        sourceUrl: candidate.url,
        menuType: candidate.menuType,
        menuTitle: candidate.menuTitle,
        priceLabel: candidate.priceLabel ?? null,
        priceValue: candidate.priceValue ?? null,
        seasonLabel: candidate.seasonLabel ?? publishedTime ?? null,
        courseTitleDrafts: candidate.courseTitleDrafts ?? [],
        localImageRelativePath: candidate.localImageRelativePath ?? null,
        pageNumber: candidate.pageNumber ?? null,
      });
    });
  }

  const manifest = buildManifest({
    restaurant,
    outputDir,
    sources: restaurant.publicSources,
    documents,
    menuCandidates: dedupeBy(
      menuCandidates,
      (candidate) =>
        `${candidate.menuType}:${candidate.menuTitle}:${candidate.sourceUrl}:${candidate.pageNumber ?? ''}:${candidate.localImageRelativePath ?? ''}`.toLowerCase(),
    ),
  });
  const manifestPath = path.join(outputDir, 'manifest.json');

  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log(`[public-source] restaurant: ${restaurant.name}`);
  console.log(`[public-source] output: ${path.relative(workspaceRoot, outputDir)}`);
  console.log(`[public-source] manifest: ${path.relative(workspaceRoot, manifestPath)}`);
  console.log(
    `[public-source] summary: ${JSON.stringify({
      documents: manifest.documents.length,
      menuCandidates: manifest.menuCandidates.length,
    })}`,
  );
}

main().catch((error) => {
  console.error(`[public-source] failed: ${error.message}`);
  process.exit(1);
});
