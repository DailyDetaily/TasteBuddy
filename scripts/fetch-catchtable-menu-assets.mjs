import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const workspaceRoot = process.cwd();
const defaultMirrorOrigin = 'https://r.jina.ai/http://www.catchtable.net/shop';
const defaultPublicOrigin = 'https://www.catchtable.net/shop';
const defaultOutputBase = path.join('tmp', 'catchtable');

function parseArgs(argv) {
  const positional = [];
  const options = {
    slug: null,
    outDir: null,
    downloadImages: true,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg === '--no-download-images') {
      options.downloadImages = false;
      continue;
    }

    if (arg.startsWith('--slug=')) {
      options.slug = arg.slice('--slug='.length).trim();
      continue;
    }

    if (arg === '--slug') {
      options.slug = argv[index + 1]?.trim() ?? null;
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

  if (!options.slug) {
    options.slug = positional[0] ?? null;
  }

  return options;
}

function printUsage() {
  console.log(`
Usage:
  node scripts/fetch-catchtable-menu-assets.mjs <slug>
  node scripts/fetch-catchtable-menu-assets.mjs --slug <slug>
  node scripts/fetch-catchtable-menu-assets.mjs <slug> --out-dir <path>
  node scripts/fetch-catchtable-menu-assets.mjs <slug> --no-download-images

Examples:
  npm run catchtable:fetch -- jungsik
  npm run catchtable:fetch -- mingles --out-dir tmp/catchtable/mingles-run
  npm run catchtable:fetch -- onjium --no-download-images
`.trim());
}

function requireSlug(slug) {
  if (!slug) {
    throw new Error('Catchtable shop slug is required. Example: jungsik');
  }
  return slug;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function sanitizeFileName(value) {
  return value.replace(/[^a-z0-9-_]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
}

function collapseWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function dedupe(list) {
  return [...new Set(list)];
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'text/markdown,text/plain;q=0.9,text/html;q=0.8,*/*;q=0.5',
      'User-Agent': 'TasteBuddyCatchtableFetcher/1.0',
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
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      'User-Agent': 'TasteBuddyCatchtableFetcher/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download "${url}" (${response.status} ${response.statusText}).`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    contentType: response.headers.get('content-type') ?? '',
    buffer: Buffer.from(arrayBuffer),
  };
}

function extractRestaurantTitle(markdown, fallbackSlug) {
  const headingMatch = markdown.match(/^#\s+(.+)$/m);
  if (!headingMatch) {
    return fallbackSlug;
  }

  const heading = collapseWhitespace(headingMatch[1]);
  const title = heading
    .split(' | ')[0]
    ?.split(' - ')[0]
    ?.trim();
  return title || fallbackSlug;
}

function extractLastUpdated(markdown) {
  const match = markdown.match(/Last update:\s*(.+)$/m);
  return match ? collapseWhitespace(match[1]) : null;
}

function extractImageUrls(markdown) {
  const matches = [...markdown.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g)];
  const urls = matches.map((match) => match[1]).filter((url) => url.includes('catchtable.co.kr/shop/manager/images/'));
  return dedupe(urls);
}

function parseMenuPrice(rawTitle) {
  const priceMatch = rawTitle.match(/^(.*?)(?:\s+₩([\d,]+))$/u);
  if (!priceMatch) {
    return {
      title: rawTitle,
      priceLabel: null,
      priceValue: null,
    };
  }

  return {
    title: collapseWhitespace(priceMatch[1]),
    priceLabel: `KRW ${priceMatch[2]}`,
    priceValue: Number(priceMatch[2].replaceAll(',', '')),
  };
}

function detectMenuType(title) {
  const lower = title.toLowerCase();
  if (lower.includes('lunch')) {
    return 'lunch';
  }
  if (lower.includes('dinner')) {
    return 'dinner';
  }
  return 'other';
}

function extractMenuEntries(markdown, imageUrls) {
  const entries = [];
  const regex = /\[####\s*([\s\S]*?)\]\((https?:\/\/www\.catchtable\.net\/shop\/[^)\s]+\/menu\?foodMenuSeq=\d+)\)/g;
  let match;

  while ((match = regex.exec(markdown)) !== null) {
    const rawTitle = collapseWhitespace(match[1]);
    const url = match[2];
    const parsedUrl = new URL(url);
    const foodMenuSeq = parsedUrl.searchParams.get('foodMenuSeq');
    const price = parseMenuPrice(rawTitle);

    entries.push({
      index: entries.length + 1,
      rawTitle,
      title: price.title,
      priceLabel: price.priceLabel,
      priceValue: price.priceValue,
      url,
      foodMenuSeq,
      menuType: detectMenuType(price.title),
      imageSourceUrlGuess: imageUrls[entries.length] ?? null,
      imageGuessMethod: imageUrls[entries.length] ? 'ordinal-order' : null,
    });
  }

  return entries;
}

function extensionFromContentType(contentType) {
  if (contentType.includes('png')) {
    return '.png';
  }
  if (contentType.includes('webp')) {
    return '.webp';
  }
  if (contentType.includes('avif')) {
    return '.avif';
  }
  return '.jpg';
}

async function downloadImages(slug, imageUrls, outputDir) {
  const imagesDir = path.join(outputDir, 'images');
  ensureDir(imagesDir);

  const assets = [];
  for (let index = 0; index < imageUrls.length; index += 1) {
    const sourceUrl = imageUrls[index];
    const { buffer, contentType } = await fetchBuffer(sourceUrl);
    const extension = extensionFromContentType(contentType);
    const fileName = `${String(index + 1).padStart(2, '0')}-${sanitizeFileName(slug)}${extension}`;
    const absolutePath = path.join(imagesDir, fileName);

    fs.writeFileSync(absolutePath, buffer);

    assets.push({
      index: index + 1,
      sourceUrl,
      contentType,
      absolutePath,
      relativePath: path.relative(workspaceRoot, absolutePath),
    });
  }

  return assets;
}

function buildManifest({
  slug,
  restaurantName,
  menusPageUrl,
  mirrorUrl,
  markdownPath,
  lastUpdated,
  imageAssets,
  menuEntries,
}) {
  const imagePathBySource = new Map(
    imageAssets.map((asset) => [asset.sourceUrl, asset.relativePath]),
  );

  return {
    fetchedAt: new Date().toISOString(),
    restaurant: {
      slug,
      displayName: restaurantName,
    },
    source: {
      menusPageUrl,
      mirrorUrl,
      rawMarkdownRelativePath: markdownPath,
      lastUpdatedLabel: lastUpdated,
    },
    notes: {
      imageGuessMethod: 'Menu links are paired with image URLs by ordinal order from the mirrored Catchtable menus page. Review before generating final CSVs.',
      nextStep: 'Review menu images, transcribe course text, then generate lunch/dinner intake CSVs.',
    },
    images: imageAssets,
    menus: menuEntries.map((entry) => ({
      ...entry,
      localImageRelativePathGuess: entry.imageSourceUrlGuess
        ? imagePathBySource.get(entry.imageSourceUrlGuess) ?? null
        : null,
    })),
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    process.exit(0);
  }

  const slug = requireSlug(options.slug);
  const outputDir = path.isAbsolute(options.outDir ?? '')
    ? options.outDir
    : path.join(workspaceRoot, options.outDir ?? defaultOutputBase, slug);

  ensureDir(outputDir);

  const menusPageUrl = `${defaultPublicOrigin}/${slug}/menus`;
  const mirrorUrl = `${defaultMirrorOrigin}/${slug}/menus`;

  console.log(`[catchtable] slug: ${slug}`);
  console.log(`[catchtable] menus page: ${menusPageUrl}`);
  console.log(`[catchtable] output dir: ${path.relative(workspaceRoot, outputDir)}`);

  const markdown = await fetchText(mirrorUrl);
  const markdownPath = path.join(outputDir, 'menus-page.md');
  fs.writeFileSync(markdownPath, markdown);

  const restaurantName = extractRestaurantTitle(markdown, slug);
  const lastUpdated = extractLastUpdated(markdown);
  const imageUrls = extractImageUrls(markdown);
  const menuEntries = extractMenuEntries(markdown, imageUrls);

  if (!menuEntries.length) {
    throw new Error(`No menu entries were found for "${slug}".`);
  }

  const imageAssets = options.downloadImages ? await downloadImages(slug, imageUrls, outputDir) : [];
  const manifest = buildManifest({
    slug,
    restaurantName,
    menusPageUrl,
    mirrorUrl,
    markdownPath: path.relative(workspaceRoot, markdownPath),
    lastUpdated,
    imageAssets,
    menuEntries,
  });

  const manifestPath = path.join(outputDir, 'manifest.json');
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(
    `[catchtable] summary: ${JSON.stringify({
      restaurantName,
      lastUpdated,
      menus: menuEntries.length,
      images: imageUrls.length,
      downloadedImages: imageAssets.length,
    })}`,
  );
  console.log(`[catchtable] manifest: ${path.relative(workspaceRoot, manifestPath)}`);
}

main().catch((error) => {
  console.error(`[catchtable] failed: ${error.message}`);
  process.exit(1);
});
