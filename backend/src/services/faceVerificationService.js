import * as blazeface from '@tensorflow-models/blazeface';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as tf from '@tensorflow/tfjs';
import sharp from 'sharp';

const FACE_MATCH_THRESHOLD = 50;
const CARD_PORTRAIT_REGION = {
  left: 0.04,
  top: 0.18,
  width: 0.3,
  height: 0.64,
};

let modelsPromise;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function toNumberPair(value) {
  if (Array.isArray(value)) {
    return value.map((item) => Number(item));
  }

  if (value && typeof value.arraySync === 'function') {
    return value.arraySync().map((item) => Number(item));
  }

  return [0, 0];
}

async function getModels() {
  if (!modelsPromise) {
    modelsPromise = (async () => {
      await tf.setBackend('cpu');
      await tf.ready();

      const [faceModel, embeddingModel] = await Promise.all([
        blazeface.load(),
        mobilenet.load({ version: 2, alpha: 1 }),
      ]);

      return {
        faceModel,
        embeddingModel,
      };
    })();
  }

  return modelsPromise;
}

async function prepareImage(buffer, targetWidth = 960) {
  const pipeline = sharp(buffer, { failOn: 'none' })
    .rotate()
    .resize({ width: targetWidth, withoutEnlargement: false })
    .removeAlpha();

  const [{ data, info }, pngBuffer] = await Promise.all([
    pipeline.clone().raw().toBuffer({ resolveWithObject: true }),
    pipeline.clone().png({ compressionLevel: 9 }).toBuffer(),
  ]);

  return {
    rawBuffer: data,
    pngBuffer,
    width: info.width,
    height: info.height,
    channels: info.channels,
  };
}

function normalizeFacePrediction(prediction, imageWidth, imageHeight) {
  const [x0, y0] = toNumberPair(prediction.topLeft);
  const [x1, y1] = toNumberPair(prediction.bottomRight);
  const left = clamp(Math.floor(Math.min(x0, x1)), 0, Math.max(0, imageWidth - 1));
  const top = clamp(Math.floor(Math.min(y0, y1)), 0, Math.max(0, imageHeight - 1));
  const right = clamp(Math.ceil(Math.max(x0, x1)), left + 1, imageWidth);
  const bottom = clamp(Math.ceil(Math.max(y0, y1)), top + 1, imageHeight);
  const width = Math.max(1, right - left);
  const height = Math.max(1, bottom - top);
  const areaRatio = (width * height) / Math.max(1, imageWidth * imageHeight);

  return {
    left,
    top,
    width,
    height,
    areaRatio,
  };
}

async function detectFaces(prepared) {
  const { faceModel } = await getModels();
  const imageTensor = tf.tensor3d(
    new Uint8Array(prepared.rawBuffer),
    [prepared.height, prepared.width, prepared.channels],
    'int32',
  );

  try {
    const predictions = await faceModel.estimateFaces(imageTensor, false);
    return predictions
      .map((prediction) => normalizeFacePrediction(prediction, prepared.width, prepared.height))
      .filter((prediction) => prediction.width > 0 && prediction.height > 0);
  } finally {
    imageTensor.dispose();
  }
}

async function buildGrayMetrics(buffer) {
  const { data, info } = await sharp(buffer, { failOn: 'none' })
    .rotate()
    .resize({ width: 320, withoutEnlargement: false })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = data;
  const total = pixels.length || 1;
  let sum = 0;

  for (let index = 0; index < pixels.length; index += 1) {
    sum += pixels[index];
  }

  const mean = sum / total;
  let variance = 0;
  let edgeEnergy = 0;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const offset = y * info.width + x;
      const value = pixels[offset];
      variance += (value - mean) ** 2;

      if (x + 1 < info.width) {
        edgeEnergy += Math.abs(value - pixels[offset + 1]);
      }

      if (y + 1 < info.height) {
        edgeEnergy += Math.abs(value - pixels[offset + info.width]);
      }
    }
  }

  const contrast = Math.sqrt(variance / total);
  const comparisons = Math.max(1, (info.width - 1) * info.height + (info.height - 1) * info.width);
  const sharpness = edgeEnergy / comparisons;

  return {
    brightness: Number(mean.toFixed(2)),
    contrast: Number(contrast.toFixed(2)),
    sharpness: Number(sharpness.toFixed(2)),
  };
}

function scoreImageQuality(metrics) {
  const brightnessScore = 100 - Math.min(100, Math.abs(metrics.brightness - 148) * 0.85);
  const contrastScore = clamp((metrics.contrast - 22) * 3.4, 0, 100);
  const sharpnessScore = clamp((metrics.sharpness - 9) * 5.5, 0, 100);

  return Math.round((brightnessScore * 0.25) + (contrastScore * 0.3) + (sharpnessScore * 0.45));
}

function resolveExtractRegion(width, height, ratio, padding = 0) {
  const paddedLeft = clamp(ratio.left - padding, 0, 1);
  const paddedTop = clamp(ratio.top - padding, 0, 1);
  const paddedRight = clamp(ratio.left + ratio.width + padding, 0, 1);
  const paddedBottom = clamp(ratio.top + ratio.height + padding, 0, 1);

  const left = clamp(Math.floor(width * paddedLeft), 0, Math.max(0, width - 1));
  const top = clamp(Math.floor(height * paddedTop), 0, Math.max(0, height - 1));
  const extractWidth = clamp(Math.ceil(width * (paddedRight - paddedLeft)), 1, width - left);
  const extractHeight = clamp(Math.ceil(height * (paddedBottom - paddedTop)), 1, height - top);

  return {
    left,
    top,
    width: extractWidth,
    height: extractHeight,
  };
}

async function cropCardPortraitBuffer(buffer) {
  const image = sharp(buffer, { failOn: 'none' }).rotate();
  const metadata = await image.metadata();
  const width = Number(metadata.width || 0);
  const height = Number(metadata.height || 0);

  if (!width || !height) {
    throw new Error('Không đọc được kích thước ảnh CCCD');
  }

  const region = resolveExtractRegion(width, height, CARD_PORTRAIT_REGION, 0.02);

  return image
    .extract(region)
    .resize({ width: 640, withoutEnlargement: false })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

function getLargestFace(faces) {
  return faces
    .slice()
    .sort((left, right) => right.areaRatio - left.areaRatio)[0] || null;
}

async function extractFaceBuffer(prepared, faceBox) {
  const horizontalPadding = Math.floor(faceBox.width * 0.22);
  const verticalPadding = Math.floor(faceBox.height * 0.24);
  const left = clamp(faceBox.left - horizontalPadding, 0, Math.max(0, prepared.width - 1));
  const top = clamp(faceBox.top - verticalPadding, 0, Math.max(0, prepared.height - 1));
  const right = clamp(faceBox.left + faceBox.width + horizontalPadding, left + 1, prepared.width);
  const bottom = clamp(faceBox.top + faceBox.height + verticalPadding, top + 1, prepared.height);

  return sharp(prepared.pngBuffer, { failOn: 'none' })
    .extract({
      left,
      top,
      width: right - left,
      height: bottom - top,
    })
    .resize(224, 224, { fit: 'cover' })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function buildEmbedding(buffer) {
  const { embeddingModel } = await getModels();
  const { data, info } = await sharp(buffer, { failOn: 'none' })
    .resize(224, 224, { fit: 'cover' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return tf.tidy(() => {
    const tensor = tf.tensor3d(new Uint8Array(data), [info.height, info.width, info.channels], 'int32');
    const batched = tensor.toFloat().div(255).expandDims(0);
    const embedding = embeddingModel.infer(batched, true);
    const normalized = tf.linalg.l2Normalize(embedding.flatten());
    return Array.from(normalized.dataSync());
  });
}

function cosineSimilarity(left, right) {
  const length = Math.min(left.length, right.length);
  let dot = 0;

  for (let index = 0; index < length; index += 1) {
    dot += left[index] * right[index];
  }

  return dot;
}

function toSimilarityScore(cosine) {
  return Math.round(clamp(((cosine - 0.42) / 0.36) * 100, 0, 100));
}

async function analyzeSelfie(buffer) {
  const prepared = await prepareImage(buffer, 960);
  const [faces, metrics] = await Promise.all([
    detectFaces(prepared),
    buildGrayMetrics(buffer),
  ]);
  const largestFace = getLargestFace(faces);
  const qualityScore = scoreImageQuality(metrics);

  if (faces.length === 0) {
    return {
      accepted: false,
      rejectionReason: 'Không tìm thấy khuôn mặt trong ảnh chân dung. Hãy chụp rõ mặt, nhìn thẳng vào camera.',
      metrics,
      qualityScore,
    };
  }

  if (faces.length > 1) {
    return {
      accepted: false,
      rejectionReason: 'Ảnh chân dung chỉ được chứa 1 khuôn mặt. Vui lòng chụp riêng một mình bạn.',
      metrics,
      qualityScore,
    };
  }

  if (!largestFace || largestFace.areaRatio < 0.08) {
    return {
      accepted: false,
      rejectionReason: 'Khuôn mặt trong ảnh quá nhỏ. Hãy đưa camera lại gần hơn.',
      metrics,
      qualityScore,
    };
  }

  if (qualityScore < 42) {
    return {
      accepted: false,
      rejectionReason: 'Ảnh chân dung mờ, quá tối hoặc quá lóa. Hãy chụp ảnh rõ hơn trong điều kiện đủ sáng.',
      metrics,
      qualityScore,
    };
  }

  return {
    accepted: true,
    metrics,
    qualityScore,
    faceBuffer: await extractFaceBuffer(prepared, largestFace),
  };
}

async function analyzeCardPortrait(buffer) {
  const portraitBuffer = await cropCardPortraitBuffer(buffer);
  const prepared = await prepareImage(portraitBuffer, 640);
  const [faces, metrics] = await Promise.all([
    detectFaces(prepared),
    buildGrayMetrics(portraitBuffer),
  ]);
  const largestFace = getLargestFace(faces);
  const qualityScore = scoreImageQuality(metrics);

  if (!largestFace || largestFace.areaRatio < 0.06) {
    return {
      accepted: false,
      rejectionReason: 'Không nhận dạng được ảnh chân dung trên CCCD. Hãy tải ảnh mặt trước rõ nét hơn.',
      metrics,
      qualityScore,
    };
  }

  if (qualityScore < 26) {
    return {
      accepted: false,
      rejectionReason: 'Vùng chân dung trên CCCD quá mờ hoặc quá tối để đối sánh.',
      metrics,
      qualityScore,
    };
  }

  return {
    accepted: true,
    metrics,
    qualityScore,
    faceBuffer: await extractFaceBuffer(prepared, largestFace),
  };
}

export async function compareFaceWithCccd({ cccdBuffer, selfieBuffer }) {
  let portraitAnalysis;
  let selfieAnalysis;

  try {
    [portraitAnalysis, selfieAnalysis] = await Promise.all([
      analyzeCardPortrait(cccdBuffer),
      analyzeSelfie(selfieBuffer),
    ]);
  } catch (error) {
    throw new Error(`Không thể khởi động bộ đối sánh khuôn mặt AI: ${error.message}`);
  }

  if (!portraitAnalysis.accepted) {
    return {
      accepted: false,
      matched: false,
      similarityScore: 0,
      rejectionReason: portraitAnalysis.rejectionReason,
      metrics: {
        portrait: portraitAnalysis.metrics,
      },
    };
  }

  if (!selfieAnalysis.accepted) {
    return {
      accepted: false,
      matched: false,
      similarityScore: 0,
      rejectionReason: selfieAnalysis.rejectionReason,
      metrics: {
        selfie: selfieAnalysis.metrics,
      },
    };
  }

  const [portraitEmbedding, selfieEmbedding] = await Promise.all([
    buildEmbedding(portraitAnalysis.faceBuffer),
    buildEmbedding(selfieAnalysis.faceBuffer),
  ]);
  const rawCosine = cosineSimilarity(portraitEmbedding, selfieEmbedding);
  const similarityScore = toSimilarityScore(rawCosine);

  return {
    accepted: true,
    matched: similarityScore >= FACE_MATCH_THRESHOLD,
    similarityScore,
    threshold: FACE_MATCH_THRESHOLD,
    rawCosine: Number(rawCosine.toFixed(4)),
    metrics: {
      portrait: portraitAnalysis.metrics,
      selfie: selfieAnalysis.metrics,
      portraitQualityScore: portraitAnalysis.qualityScore,
      selfieQualityScore: selfieAnalysis.qualityScore,
    },
  };
}