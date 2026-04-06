import sharp from 'sharp';
import Tesseract from 'tesseract.js';

const OCR_VARIANT_PRIORITY = {
  nameRegionBinary: 120,
  nameRegionGray: 112,
  nameRegionColor: 104,
  fullBinary: 52,
  fullGray: 44,
  fullColor: 36,
};

const CCCD_REGION_RATIOS = {
  name: { left: 0.35, top: 0.44, width: 0.44, height: 0.17 },
  number: { left: 0.36, top: 0.31, width: 0.37, height: 0.11 },
};

function normalizeSpaces(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeLine(value) {
  return String(value || '').replace(/[ \t]+/g, ' ').trim();
}

function normalizeOcrText(value) {
  return normalizeLine(
    String(value || '')
      .replace(/[|¦]/g, ' ')
      .replace(/[“”"`]/g, ' ')
      .replace(/_{2,}/g, ' ')
      .replace(/\s{2,}/g, ' '),
  );
}

function stripDiacritics(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

function normalizeComparableName(value) {
  return normalizeSpaces(stripDiacritics(value).toUpperCase().replace(/[^A-Z0-9 ]+/g, ' '));
}

function getComparableWords(value) {
  return new Set(normalizeComparableName(value).split(' ').filter((word) => word.length >= 2));
}

function titleCase(value) {
  return normalizeSpaces(
    String(value || '')
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' '),
  );
}

function isMostlyUppercase(value) {
  const letters = String(value || '').replace(/[^A-Za-zÀ-ỹĐđ]/g, '');
  if (!letters) {
    return false;
  }

  const uppercaseLetters = letters.replace(/[^A-ZÀ-ỸĐ]/g, '');
  return uppercaseLetters.length / letters.length >= 0.75;
}

function formatDetectedName(value) {
  const cleaned = normalizeOcrText(value);
  if (!cleaned) {
    return '';
  }

  return isMostlyUppercase(cleaned) ? normalizeSpaces(cleaned) : titleCase(cleaned);
}

const NAME_STOP_REGEX = /(ng[aà]y\s*sinh|date\s*of\s*birth|gi[oớ]i\s*t[ií]nh|\bsex\b|qu[oố]c\s*t[iị]ch|nationality|qu[eê]\s*qu[aá]n|place\s*of\s*origin|n[oơ]i\s*th[uư][oờ]ng\s*tr[uú]|place\s*of\s*residence|c[oó]\s*gi[aá]\s*tr[iị]|date\s*of\s*expiry)/i;
const NAME_LABEL_REGEX = /(h[oọo0]?\s*v[aàa4]?\s*t[eêe3]n|full\s*name|^name)\s*(?:\/\s*full\s*name)?\s*[:;-]*/i;
const LABEL_PATTERNS = [/HO VA TEN/, /HO TEN/, /FULL NAME/, /^NAME$/];
const FORBIDDEN_NAME_WORDS = [
  'CAN',
  'CUOC',
  'CONG',
  'DAN',
  'SO',
  'DATE',
  'BIRTH',
  'SEX',
  'NATIONALITY',
  'PLACE',
  'ORIGIN',
  'RESIDENCE',
  'EXPIRY',
  'VIET',
  'NAM',
  'SOCIALIST',
  'REPUBLIC',
  'CARD',
  'CITIZEN',
  'IDENTITY',
  'NGAY',
  'SINH',
  'GIOI',
  'TINH',
  'QUOC',
  'TICH',
  'QUE',
  'QUAN',
  'THUONG',
  'TRU',
];

function truncateAtStopLabel(value) {
  const cleaned = normalizeOcrText(value);
  if (!cleaned) {
    return '';
  }

  const stopMatch = cleaned.match(NAME_STOP_REGEX);
  if (!stopMatch || stopMatch.index == null) {
    return cleaned;
  }

  return normalizeSpaces(cleaned.slice(0, stopMatch.index));
}

function extractInlineName(value) {
  const withoutLabel = normalizeOcrText(String(value || '').replace(NAME_LABEL_REGEX, ' '));
  return truncateAtStopLabel(withoutLabel)
    .replace(/^[:;\-\s]+/, '')
    .trim();
}

function getLineBbox(line) {
  const bbox = line?.bbox;
  if (!bbox) {
    return null;
  }

  const x0 = Number(bbox.x0);
  const y0 = Number(bbox.y0);
  const x1 = Number(bbox.x1);
  const y1 = Number(bbox.y1);

  if (![x0, y0, x1, y1].every(Number.isFinite)) {
    return null;
  }

  return { x0, y0, x1, y1 };
}

function toStructuredLine(line, index) {
  const text = normalizeOcrText(typeof line === 'string' ? line : line?.text || '');
  if (!text) {
    return null;
  }

  return {
    index,
    text,
    comparableText: normalizeComparableName(text),
    confidence: Number(typeof line === 'string' ? 0 : line?.confidence || 0),
    bbox: typeof line === 'string' ? null : getLineBbox(line),
  };
}

function buildStructuredLines(lines, text) {
  if (Array.isArray(lines) && lines.length > 0) {
    const structuredLines = lines
      .map((line, index) => toStructuredLine(line, index))
      .filter(Boolean);

    if (structuredLines.length > 0) {
      return structuredLines;
    }
  }

  return String(text || '')
    .split(/\r?\n/g)
    .map((line, index) => toStructuredLine(line, index))
    .filter(Boolean);
}

function getLineHeight(line) {
  if (!line?.bbox) {
    return 0;
  }

  return Math.max(line.bbox.y1 - line.bbox.y0, 0);
}

function getVerticalGap(upperLine, lowerLine) {
  if (!upperLine?.bbox || !lowerLine?.bbox) {
    return Number.POSITIVE_INFINITY;
  }

  return lowerLine.bbox.y0 - upperLine.bbox.y1;
}

function getHorizontalOverlapRatio(leftLine, rightLine) {
  if (!leftLine?.bbox || !rightLine?.bbox) {
    return 0;
  }

  const overlap = Math.max(0, Math.min(leftLine.bbox.x1, rightLine.bbox.x1) - Math.max(leftLine.bbox.x0, rightLine.bbox.x0));
  const minWidth = Math.max(1, Math.min(leftLine.bbox.x1 - leftLine.bbox.x0, rightLine.bbox.x1 - rightLine.bbox.x0));

  return overlap / minWidth;
}

function getLeftEdgeDeltaRatio(baseLine, candidateLine) {
  if (!baseLine?.bbox || !candidateLine?.bbox) {
    return Number.POSITIVE_INFINITY;
  }

  const baseWidth = Math.max(1, baseLine.bbox.x1 - baseLine.bbox.x0);
  return Math.abs(candidateLine.bbox.x0 - baseLine.bbox.x0) / baseWidth;
}

function lineContainsNameLabel(line) {
  return LABEL_PATTERNS.some((pattern) => pattern.test(line?.comparableText || ''));
}

function looksLikePersonName(value) {
  const normalized = normalizeComparableName(truncateAtStopLabel(value));
  const words = normalized.split(' ').filter((word) => word.length > 0);
  const alphaLength = normalized.replace(/[^A-Z]/g, '').length;
  const digitLength = normalized.replace(/[^0-9]/g, '').length;
  const forbiddenHits = words.filter((word) => FORBIDDEN_NAME_WORDS.includes(word)).length;

  return words.length >= 2
    && words.length <= 6
    && alphaLength >= 4
    && digitLength === 0
    && forbiddenHits === 0;
}

function isLikelyBelowLabel(labelLine, candidateLine, offset) {
  if (!labelLine || !candidateLine) {
    return false;
  }

  if (!labelLine.bbox || !candidateLine.bbox) {
    return offset <= 2;
  }

  const labelHeight = Math.max(getLineHeight(labelLine), 1);
  const verticalGap = getVerticalGap(labelLine, candidateLine);

  if (verticalGap < -labelHeight * 0.4) {
    return false;
  }

  if (verticalGap > labelHeight * (offset === 1 ? 3.8 : 5.6)) {
    return false;
  }

  const overlapRatio = getHorizontalOverlapRatio(labelLine, candidateLine);
  const leftDeltaRatio = getLeftEdgeDeltaRatio(labelLine, candidateLine);

  return overlapRatio >= 0.18 || leftDeltaRatio <= 0.6;
}

function isLikelyNameContinuation(firstLine, secondLine) {
  if (!firstLine || !secondLine) {
    return false;
  }

  if (!firstLine.bbox || !secondLine.bbox) {
    return looksLikePersonName(`${firstLine.text} ${secondLine.text}`);
  }

  const firstHeight = Math.max(getLineHeight(firstLine), 1);
  const gap = getVerticalGap(firstLine, secondLine);
  const overlapRatio = getHorizontalOverlapRatio(firstLine, secondLine);
  const leftDeltaRatio = getLeftEdgeDeltaRatio(firstLine, secondLine);

  return gap >= -firstHeight * 0.2
    && gap <= firstHeight * 1.8
    && (overlapRatio >= 0.3 || leftDeltaRatio <= 0.35)
    && !NAME_STOP_REGEX.test(secondLine.text)
    && looksLikePersonName(`${firstLine.text} ${secondLine.text}`);
}

function countSharedWords(leftWords, rightWords) {
  let count = 0;
  leftWords.forEach((word) => {
    if (rightWords.has(word)) {
      count += 1;
    }
  });
  return count;
}

function scoreNameCandidate(candidate, accountName, baseScore, candidateLine) {
  const accountWords = getComparableWords(accountName);
  const candidateWords = getComparableWords(candidate);
  const sharedWordCount = countSharedWords(candidateWords, accountWords);
  const confidenceBonus = Number.isFinite(candidateLine?.confidence)
    ? Math.min(candidateLine.confidence, 95) / 10
    : 0;

  return baseScore
    + confidenceBonus
    + (isMostlyUppercase(candidate) ? 4 : 0)
    + sharedWordCount * 12
    + (namesAreEquivalent(accountName, candidate) ? 80 : 0);
}

function extractNameCandidates(lines, text, accountName = '', basePriority = 0) {
  const structuredLines = buildStructuredLines(lines, text);
  const candidateMap = new Map();

  const pushCandidate = (value, priorityBoost, candidateLine) => {
    const candidate = formatDetectedName(truncateAtStopLabel(value));
    if (!looksLikePersonName(candidate)) {
      return;
    }

    const comparableCandidate = normalizeComparableName(candidate);
    const score = scoreNameCandidate(candidate, accountName, basePriority + priorityBoost, candidateLine);
    const existing = candidateMap.get(comparableCandidate);

    if (!existing || score > existing.score) {
      candidateMap.set(comparableCandidate, { value: candidate, score });
    }
  };

  structuredLines.forEach((line, index) => {
    if (!lineContainsNameLabel(line)) {
      return;
    }

    const inlineCandidate = extractInlineName(line.text);
    if (inlineCandidate) {
      pushCandidate(inlineCandidate, 92, line);
    }

    for (let offset = 1; offset <= 3; offset += 1) {
      const candidateLine = structuredLines[index + offset];
      if (!isLikelyBelowLabel(line, candidateLine, offset)) {
        continue;
      }

      pushCandidate(candidateLine.text, 86 - offset * 8, candidateLine);

      const nextLine = structuredLines[index + offset + 1];
      if (isLikelyNameContinuation(candidateLine, nextLine)) {
        pushCandidate(`${candidateLine.text} ${nextLine.text}`, 90 - offset * 8, nextLine);
      }
    }
  });

  const joinedText = normalizeOcrText(String(text || ''));
  const labelMatch = joinedText.match(/(?:h[oọo0]?\s*v[aàa4]?\s*t[eêe3]n\s*\/\s*full\s*name|h[oọo0]?\s*v[aàa4]?\s*t[eêe3]n|full\s*name)\s*:?\s*([^\n]+)/i);
  if (labelMatch?.[1]) {
    pushCandidate(labelMatch[1], 70, null);
  }

  structuredLines.forEach((line) => {
    pushCandidate(line.text, 18, line);
  });

  return [...candidateMap.values()]
    .sort((left, right) => right.score - left.score)
    .map((item) => item.value);
}

export function namesAreEquivalent(accountName, extractedName) {
  const left = normalizeComparableName(accountName);
  const right = normalizeComparableName(extractedName);

  if (!left || !right) {
    return false;
  }

  if (left === right || left.includes(right) || right.includes(left)) {
    return true;
  }

  const leftWords = getComparableWords(left);
  const rightWords = getComparableWords(right);
  const maxWordCount = Math.max(leftWords.size, rightWords.size, 1);
  const minWordCount = Math.max(1, Math.min(leftWords.size, rightWords.size));
  const sharedCount = countSharedWords(leftWords, rightWords);

  return sharedCount / maxWordCount >= 0.8
    || (sharedCount / minWordCount >= 0.9 && sharedCount >= 2 && Math.abs(leftWords.size - rightWords.size) <= 1);
}

function extractCccdNumber(text) {
  const matches = String(text || '').match(/(?:\d[\s.]*){9,12}/g) || [];

  for (const match of matches) {
    const digits = match.replace(/\D/g, '');
    if (digits.length >= 9 && digits.length <= 12) {
      return digits;
    }
  }

  return '';
}

function mergeUniqueCandidates(candidateGroups) {
  const seen = new Set();
  const merged = [];

  candidateGroups.flat().forEach((candidate) => {
    const key = normalizeComparableName(candidate);
    if (!key || seen.has(key)) {
      return;
    }

    seen.add(key);
    merged.push(candidate);
  });

  return merged;
}

export function chooseBestDetectedName(accountName, candidates) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return '';
  }

  const exactCandidate = candidates.find((candidate) => namesAreEquivalent(accountName, candidate));
  if (exactCandidate) {
    return exactCandidate;
  }

  const accountWords = getComparableWords(accountName);

  return candidates
    .slice()
    .sort((left, right) => {
      const leftScore = countSharedWords(accountWords, getComparableWords(left));
      const rightScore = countSharedWords(accountWords, getComparableWords(right));

      if (rightScore !== leftScore) {
        return rightScore - leftScore;
      }

      return right.length - left.length;
    })[0] || '';
}

function ratioToRegion(metadata, ratio) {
  const width = Number(metadata?.width || 0);
  const height = Number(metadata?.height || 0);

  if (!width || !height) {
    return null;
  }

  const left = Math.min(Math.max(0, Math.floor(width * ratio.left)), Math.max(0, width - 1));
  const top = Math.min(Math.max(0, Math.floor(height * ratio.top)), Math.max(0, height - 1));
  const maxRegionWidth = width - left;
  const maxRegionHeight = height - top;

  if (maxRegionWidth <= 0 || maxRegionHeight <= 0) {
    return null;
  }

  const regionWidth = Math.min(maxRegionWidth, Math.max(1, Math.floor(width * ratio.width)));
  const regionHeight = Math.min(maxRegionHeight, Math.max(1, Math.floor(height * ratio.height)));

  if (regionWidth <= 0 || regionHeight <= 0) {
    return null;
  }

  return {
    left,
    top,
    width: regionWidth,
    height: regionHeight,
  };
}

async function buildBaseSharp(buffer) {
  const initial = sharp(buffer, { failOn: 'none' }).rotate();
  const metadata = await initial.metadata();
  const sourceWidth = Number(metadata.width || 0);

  if (!sourceWidth) {
    return sharp(buffer, { failOn: 'none' }).rotate();
  }

  const targetWidth = sourceWidth >= 1600 ? sourceWidth : 1600;
  return sharp(buffer, { failOn: 'none' })
    .rotate()
    .resize({ width: targetWidth, withoutEnlargement: false })
    .sharpen();
}

async function createPngBuffer(transformer) {
  return transformer.png({ compressionLevel: 9 }).toBuffer();
}

async function createExtractedVariant(baseImage, region, pipeline) {
  if (!region) {
    return null;
  }

  try {
    return await createPngBuffer(pipeline(baseImage.clone().extract(region)));
  } catch {
    return null;
  }
}

async function buildOcrVariants(buffer) {
  const baseImage = await buildBaseSharp(buffer);
  const metadata = await baseImage.metadata();
  const nameRegion = ratioToRegion(metadata, CCCD_REGION_RATIOS.name);
  const numberRegion = ratioToRegion(metadata, CCCD_REGION_RATIOS.number);

  const fullColor = await createPngBuffer(baseImage.clone().normalize());
  const fullGray = await createPngBuffer(baseImage.clone().normalize().grayscale());
  const fullBinary = await createPngBuffer(baseImage.clone().normalize().grayscale().threshold(170));

  const nameColor = await createExtractedVariant(
    baseImage,
    nameRegion,
    (image) => image.normalize().resize({ width: 1600, withoutEnlargement: false }).sharpen(),
  );
  const nameGray = await createExtractedVariant(
    baseImage,
    nameRegion,
    (image) => image.normalize().grayscale().resize({ width: 1800, withoutEnlargement: false }).sharpen(),
  );
  const nameBinary = await createExtractedVariant(
    baseImage,
    nameRegion,
    (image) => image.normalize().grayscale().threshold(165).resize({ width: 2000, withoutEnlargement: false }).sharpen(),
  );
  const numberGray = await createExtractedVariant(
    baseImage,
    numberRegion,
    (image) => image.normalize().grayscale().resize({ width: 1800, withoutEnlargement: false }).sharpen(),
  );
  const numberBinary = await createExtractedVariant(
    baseImage,
    numberRegion,
    (image) => image.normalize().grayscale().threshold(165).resize({ width: 2200, withoutEnlargement: false }).sharpen(),
  );

  return [
    { key: 'fullColor', buffer: fullColor, type: 'full' },
    { key: 'fullGray', buffer: fullGray, type: 'full' },
    { key: 'fullBinary', buffer: fullBinary, type: 'full' },
    ...(nameColor ? [{ key: 'nameRegionColor', buffer: nameColor, type: 'name' }] : []),
    ...(nameGray ? [{ key: 'nameRegionGray', buffer: nameGray, type: 'name' }] : []),
    ...(nameBinary ? [{ key: 'nameRegionBinary', buffer: nameBinary, type: 'name' }] : []),
    ...(numberGray ? [{ key: 'numberRegionGray', buffer: numberGray, type: 'number' }] : []),
    ...(numberBinary ? [{ key: 'numberRegionBinary', buffer: numberBinary, type: 'number' }] : []),
  ];
}

async function recognizeBuffer(buffer) {
  try {
    return await Tesseract.recognize(buffer, 'vie+eng');
  } catch {
    return Tesseract.recognize(buffer, 'eng');
  }
}

function normalizeRecognizedLines(lines, text) {
  return buildStructuredLines(lines, text).map((line) => line.text);
}

export async function scanCccdImage(buffer) {
  const variants = await buildOcrVariants(buffer);
  const results = [];

  for (const variant of variants) {
    try {
      const result = await recognizeBuffer(variant.buffer);
      const text = String(result?.data?.text || '');
      const lines = Array.isArray(result?.data?.lines) ? result.data.lines : [];

      results.push({
        key: variant.key,
        type: variant.type,
        text,
        lines,
      });
    } catch {
      // Ignore failed OCR passes and keep the passes that succeeded.
    }
  }

  if (results.length === 0) {
    return {
      rawText: '',
      rawLines: [],
      detectedNames: [],
      detectedCccdNumber: '',
    };
  }

  const fullPass = results.find((item) => item.key === 'fullColor') || results[0];
  const nameCandidates = mergeUniqueCandidates(
    results
      .filter((item) => item.type === 'name' || item.type === 'full')
      .sort((left, right) => (OCR_VARIANT_PRIORITY[right.key] || 0) - (OCR_VARIANT_PRIORITY[left.key] || 0))
      .map((item) => extractNameCandidates(item.lines, item.text, '', OCR_VARIANT_PRIORITY[item.key] || 0)),
  );

  const numberCandidates = results
    .filter((item) => item.type === 'number' || item.type === 'full')
    .sort((left, right) => {
      const leftPriority = left.type === 'number' ? 1 : 0;
      const rightPriority = right.type === 'number' ? 1 : 0;

      if (leftPriority !== rightPriority) {
        return rightPriority - leftPriority;
      }

      return (OCR_VARIANT_PRIORITY[right.key] || 0) - (OCR_VARIANT_PRIORITY[left.key] || 0);
    })
    .map((item) => extractCccdNumber(item.text))
    .find(Boolean) || '';

  return {
    rawText: normalizeSpaces(fullPass.text),
    rawLines: normalizeRecognizedLines(fullPass.lines, fullPass.text),
    detectedNames: nameCandidates,
    detectedCccdNumber: numberCandidates,
  };
}

async function getImageQualityMetrics(buffer) {
  const { data, info } = await sharp(buffer, { failOn: 'none' })
    .rotate()
    .resize({ width: 420, withoutEnlargement: false })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let sum = 0;

  for (let index = 0; index < data.length; index += 1) {
    sum += data[index];
  }

  const mean = sum / Math.max(1, data.length);
  let variance = 0;
  let edgeEnergy = 0;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const offset = y * info.width + x;
      const value = data[offset];
      variance += (value - mean) ** 2;

      if (x + 1 < info.width) {
        edgeEnergy += Math.abs(value - data[offset + 1]);
      }

      if (y + 1 < info.height) {
        edgeEnergy += Math.abs(value - data[offset + info.width]);
      }
    }
  }

  return {
    brightness: Number(mean.toFixed(2)),
    contrast: Number(Math.sqrt(variance / Math.max(1, data.length)).toFixed(2)),
    sharpness: Number((edgeEnergy / Math.max(1, ((info.width - 1) * info.height) + ((info.height - 1) * info.width))).toFixed(2)),
  };
}

export async function assessCccdImageSuitability(buffer, existingScanResult = null) {
  const [metadata, metrics] = await Promise.all([
    sharp(buffer, { failOn: 'none' }).rotate().metadata(),
    getImageQualityMetrics(buffer),
  ]);
  const scanResult = existingScanResult || await scanCccdImage(buffer);
  const width = Number(metadata.width || 0);
  const height = Number(metadata.height || 0);
  const aspectRatio = width && height ? width / height : 0;
  const reasons = [];

  if (!width || !height) {
    reasons.push('Không đọc được kích thước ảnh CCCD');
  }

  if (width < 900 || height < 520) {
    reasons.push('Ảnh CCCD quá nhỏ, khó OCR và đối sánh AI chính xác');
  }

  if (aspectRatio < 1.2 || aspectRatio > 2.2) {
    reasons.push('Ảnh CCCD không đúng tỉ lệ thông thường. Hãy chụp trọn mặt trước thẻ');
  }

  if (!scanResult.detectedNames.length || !scanResult.detectedCccdNumber) {
    reasons.push('Hệ thống không nhận đủ thông tin cơ bản của CCCD');
  }

  if (metrics.sharpness < 11) {
    reasons.push('Ảnh CCCD bị mờ hoặc rung tay');
  }

  if (metrics.contrast < 18) {
    reasons.push('Ảnh CCCD có độ tương phản quá thấp, dễ nhầm với ảnh không hợp lệ');
  }

  if (metrics.brightness < 55 || metrics.brightness > 232) {
    reasons.push('Ảnh CCCD quá tối hoặc quá sáng');
  }

  const qualityScore = Math.round(
    (Math.max(0, 100 - Math.min(100, Math.abs(metrics.brightness - 145) * 0.82)) * 0.22)
    + (Math.min(100, Math.max(0, (metrics.contrast - 18) * 3.2)) * 0.3)
    + (Math.min(100, Math.max(0, (metrics.sharpness - 10) * 5.6)) * 0.48),
  );

  return {
    accepted: reasons.length === 0,
    qualityScore,
    metrics,
    reasons,
  };
}