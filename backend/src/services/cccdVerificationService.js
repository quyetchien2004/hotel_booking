import Tesseract from 'tesseract.js';

function normalizeSpaces(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeLine(value) {
  return String(value || '').replace(/[ \t]+/g, ' ').trim();
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

function looksLikePersonName(value) {
  const normalized = normalizeComparableName(value);
  const words = normalized.split(' ').filter((word) => word.length > 0);
  const alphaLength = normalized.replace(/[^A-Z]/g, '').length;
  return words.length >= 2 && words.length <= 8 && alphaLength >= 4;
}

function extractNameCandidates(lines, text) {
  const rawLines = Array.isArray(lines) && lines.length > 0
    ? lines.map((line) => normalizeLine(line)).filter(Boolean)
    : String(text || '')
        .split(/\r?\n/g)
        .map((line) => normalizeLine(line))
        .filter(Boolean);

  const syntheticLines = String(text || '')
    .split(/(?=H[oọo]?\s+v[aàa]\s+t[eêe]n)|(?=Full\s*name)|(?=Name\s*:)/gi)
    .map((line) => normalizeLine(line))
    .filter(Boolean);

  const candidateLines = [...rawLines, ...syntheticLines];

  const candidates = [];
  const labelPatterns = [/HO\s+VA\s+TEN/, /HO\s+TEN/, /FULL\s*NAME/, /\bNAME\b/];

  candidateLines.forEach((line, index) => {
    const normalizedLine = normalizeComparableName(line);
    const hasLabel = labelPatterns.some((pattern) => pattern.test(normalizedLine));

    if (!hasLabel) {
      if (looksLikePersonName(line)) {
        candidates.push(line);
      }
      return;
    }

    const inlineCandidate = normalizeSpaces(
      line
        .replace(/h[oọo0]?[\s._-]*v[aàa4]?[\s._-]*t[eêe3]n\s*\/?.*?:?/i, '')
        .replace(/full\s*name\s*[:.-]*/i, '')
        .replace(/^name\s*[:.-]*/i, '')
        .replace(/^[:\-\s]+/, ''),
    );

    if (looksLikePersonName(inlineCandidate)) {
      candidates.push(inlineCandidate);
    }

    const nextLine = candidateLines[index + 1] || '';
    if (looksLikePersonName(nextLine)) {
      candidates.push(nextLine);
    }
  });

  return [...new Set(candidates.map((item) => titleCase(item)).filter(Boolean))];
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

export function namesAreEquivalent(accountName, extractedName) {
  const left = normalizeComparableName(accountName);
  const right = normalizeComparableName(extractedName);

  if (!left || !right) {
    return false;
  }

  if (left === right || left.includes(right) || right.includes(left)) {
    return true;
  }

  const leftWords = new Set(left.split(' ').filter((word) => word.length >= 2));
  const rightWords = new Set(right.split(' ').filter((word) => word.length >= 2));
  const maxWordCount = Math.max(leftWords.size, rightWords.size, 1);
  const sharedCount = countSharedWords(leftWords, rightWords);

  return sharedCount / maxWordCount >= 0.8;
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

export function chooseBestDetectedName(accountName, candidates) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return '';
  }

  const exactCandidate = candidates.find((candidate) => namesAreEquivalent(accountName, candidate));
  if (exactCandidate) {
    return exactCandidate;
  }

  return candidates.sort((left, right) => right.length - left.length)[0] || '';
}

export async function scanCccdImage(buffer) {
  let result;

  try {
    result = await Tesseract.recognize(buffer, 'vie+eng');
  } catch {
    result = await Tesseract.recognize(buffer, 'eng');
  }

  const rawText = String(result?.data?.text || '');
  const rawLines = Array.isArray(result?.data?.lines)
    ? result.data.lines.map((line) => line?.text || '')
    : [];
  const detectedNames = extractNameCandidates(rawLines, rawText);
  const detectedCccdNumber = extractCccdNumber(rawText);

  return {
    rawText: normalizeSpaces(rawText),
    rawLines: rawLines.map((line) => normalizeLine(line)).filter(Boolean),
    detectedNames,
    detectedCccdNumber,
  };
}