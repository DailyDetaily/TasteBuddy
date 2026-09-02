import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

export const NONGSARO_NATIVE_FOOD_SERVICE_NAME = 'nvpcFdCkry';
export const NONGSARO_NATIVE_FOOD_API_BASE_URL =
  `http://api.nongsaro.go.kr/service/${NONGSARO_NATIVE_FOOD_SERVICE_NAME}`;

export function loadDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex <= 0) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, '');

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  });
}

export function loadProjectEnv(workspaceRoot = process.cwd()) {
  loadDotEnvFile(path.join(workspaceRoot, '.env.local'));
}

export function requireNongsaroApiKey() {
  const apiKey = process.env.NONGSARO_API_KEY;

  if (!apiKey || apiKey === 'YOUR_NONGSARO_API_KEY_HERE') {
    throw new Error('Missing NONGSARO_API_KEY. Add it to .env.local before running this script.');
  }

  return apiKey;
}

export function buildNongsaroApiUrl(operationName, params) {
  const url = new URL(`${NONGSARO_NATIVE_FOOD_API_BASE_URL}/${operationName}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    url.searchParams.set(key, String(value));
  });

  return url;
}

export async function fetchNongsaroXml(operationName, params, options = {}) {
  const timeoutMs = options.timeoutMs ?? 15000;
  const url = buildNongsaroApiUrl(operationName, params);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`Nongsaro API request failed with HTTP ${response.status}.`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export function decodeXml(value) {
  return `${value ?? ''}`
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getXmlField(xml, fieldName) {
  const pattern = new RegExp(`<${fieldName}>([\\s\\S]*?)<\\/${fieldName}>`);
  const match = xml.match(pattern);

  return decodeXml(match?.[1] ?? '');
}

export function getXmlItems(xml) {
  return Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g)).map((match) => match[1]);
}

export function xmlItemToObject(itemXml) {
  return Object.fromEntries(
    Array.from(itemXml.matchAll(/<([A-Za-z0-9_]+)>([\s\S]*?)<\/\1>/g))
      .map((match) => [match[1], decodeXml(match[2])])
      .filter(([fieldName]) => fieldName !== 'item'),
  );
}

export function pickXmlFields(xml, fieldNames) {
  return Object.fromEntries(fieldNames.map((fieldName) => [fieldName, getXmlField(xml, fieldName)]));
}

export function getNongsaroResultMessage(xml) {
  return getXmlField(xml, 'errorMsg') || getXmlField(xml, 'resultMsg');
}

export function splitPathField(value) {
  return `${value ?? ''}`
    .split('>')
    .map((part) => part.trim())
    .filter(Boolean);
}

export function buildNativeFoodImageUrls(detailFields) {
  const fileCourses = `${detailFields.rtnFileCours ?? ''}`.split('|').filter(Boolean);
  const fileNames = `${detailFields.rtnStreFileNm ?? ''}`.split('|').filter(Boolean);
  const imageTypeCodes = `${detailFields.rtnImgSeCode ?? ''}`.split('|').filter(Boolean);

  return fileNames
    .map((fileName, index) => {
      const fileCourse = fileCourses[index];

      if (!fileCourse || !fileName) {
        return null;
      }

      return {
        typeCode: imageTypeCodes[index] ?? '',
        url: `http://www.nongsaro.go.kr/${fileCourse}/${fileName}`,
      };
    })
    .filter(Boolean);
}

export function summarizeNativeFoodListItem(itemXml) {
  const fields = xmlItemToObject(itemXml);

  return {
    cntntsNo: fields.cntntsNo ?? '',
    trditfdNm: fields.trditfdNm ?? '',
    foodTyCodeFullname: fields.foodTyCodeFullname ?? '',
    ckryCodeFullname: fields.ckryCodeFullname ?? '',
  };
}

export function summarizeNativeFoodDetailItem(itemXml) {
  const fields = xmlItemToObject(itemXml);

  return {
    cntntsNo: fields.cntntsNo ?? '',
    trditfdNm: fields.trditfdNm ?? '',
    foodTyCodeFullname: fields.foodTyCodeFullname ?? '',
    ckryCodeFullname: fields.ckryCodeFullname ?? '',
    fdmtInfo: fields.fdmtInfo ?? '',
    asstnMatrlInfo: fields.asstnMatrlInfo ?? '',
    stdCkryDtl: fields.stdCkryDtl ?? '',
    originDtl: fields.originDtl ?? '',
  };
}
