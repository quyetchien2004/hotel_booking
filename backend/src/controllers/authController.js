import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { sendPasswordResetOtpEmail, generateOtpCode, hashOtp } from '../services/mailService.js';
import { getUserBookingProfile } from '../services/bookingService.js';
import {
  assessCccdImageSuitability,
  chooseBestDetectedName,
  namesAreEquivalent,
  scanCccdImage,
} from '../services/cccdVerificationService.js';
import { compareFaceWithCccd } from '../services/faceVerificationService.js';
import { signAccessToken } from '../services/tokenService.js';
import {
  validateLoginPayload,
  validateRegisterPayload,
  validateResetPasswordWithOtpPayload,
  validateSendResetOtpPayload,
  validateVerifyCccdPayload,
} from '../validators/authValidator.js';

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function dataUrlToBuffer(dataUrl) {
  const match = String(dataUrl || '').match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
  if (!match) {
    return null;
  }

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  };
}

function buildImageDataUrl({ mimeType, buffer }) {
  if (!mimeType || !buffer) {
    return '';
  }

  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

function getVerificationBreakdown(userLike) {
  const nameMatched = Boolean(userLike?.cccdNameMatched);
  const faceMatched = Boolean(userLike?.faceMatched);
  const faceSimilarityScore = Number(userLike?.faceMatchScore || 0);

  return {
    nameMatched,
    faceMatched,
    nameScore: nameMatched ? 40 : 0,
    faceScore: faceMatched ? 40 : 0,
    totalScore: (nameMatched ? 40 : 0) + (faceMatched ? 40 : 0),
    faceSimilarityScore,
    faceMatchThreshold: 50,
  };
}

function readUploadedImage(request, fieldName, fallbackDataUrl) {
  const file = request.files?.[fieldName]?.[0];
  if (file?.buffer) {
    return {
      buffer: file.buffer,
      mimeType: file.mimetype || 'image/jpeg',
    };
  }

  return dataUrlToBuffer(fallbackDataUrl);
}

function buildVerificationMessage(verificationBreakdown) {
  if (verificationBreakdown.totalScore >= 80) {
    return 'Xác thực CCCD và đối sánh khuôn mặt thành công';
  }

  return 'Đã đối chiếu họ tên trên CCCD, nhưng khuôn mặt chưa đạt ngưỡng 50% để hoàn tất xác thực đầy đủ';
}

async function createAuthResponse(user) {
  const bookingProfile = await getUserBookingProfile(user._id);
  const verificationBreakdown = getVerificationBreakdown(user);
  const token = signAccessToken({
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      fullName: user.name,
      username: user.username || null,
      email: user.email,
      phone: user.phone || '',
      isActive: Boolean(user.isActive !== false),
      cccdNumber: user.cccdNumber || null,
      cccdImageDataUrl: user.cccdImageDataUrl || '',
      faceImageDataUrl: user.faceImageDataUrl || '',
      isCccdVerified: Boolean(user.isCccdVerified),
      cccdNameMatched: verificationBreakdown.nameMatched,
      faceMatched: verificationBreakdown.faceMatched,
      faceMatchScore: verificationBreakdown.faceSimilarityScore,
      verificationBreakdown,
      trustScore: Number(user.trustScore || 0),
      successfulBookingCount: bookingProfile.successfulBookingCount,
      isLoyalGuest: bookingProfile.isLoyalGuest,
      role: user.role,
    },
  };
}

export async function register(request, response, next) {
  try {
    const validation = validateRegisterPayload(request.body);

    if (!validation.valid) {
      throw createHttpError(validation.errors[0], 400);
    }

    const { fullName, username, phone, email, password } = validation.data;
    const existingUser = await User.findOne({
      $or: [{ email }, ...(username ? [{ username }] : [])],
    }).lean();

    if (existingUser) {
      throw createHttpError('Email hoặc username đã tồn tại', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const adminCount = await User.countDocuments({ role: { $in: ['admin', 'ADMIN'] } });
    const user = await User.create({
      name: fullName,
      username: username || undefined,
      phone: phone || '',
      email,
      passwordHash,
      role: adminCount === 0 ? 'admin' : 'member',
      trustScore: 0,
      isCccdVerified: false,
    });

    response.status(201).json(await createAuthResponse(user));
  } catch (error) {
    next(error);
  }
}

export async function login(request, response, next) {
  try {
    const validation = validateLoginPayload(request.body);

    if (!validation.valid) {
      throw createHttpError(validation.errors[0], 400);
    }

    const { identifier, password } = validation.data;
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      throw createHttpError('Invalid email or password', 401);
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      throw createHttpError('Invalid email or password', 401);
    }

    if (user.isActive === false) {
      throw createHttpError('Tài khoản đã bị khóa', 403);
    }

    response.json(await createAuthResponse(user));
  } catch (error) {
    next(error);
  }
}

export async function getProfile(request, response, next) {
  try {
    const user = await User.findById(request.auth.userId).select(
      '_id name username email phone role isActive cccdNumber cccdImageDataUrl faceImageDataUrl isCccdVerified cccdNameMatched cccdNameVerifiedAt faceMatched faceMatchScore faceVerifiedAt idCardVerifiedAt trustScore',
    );

    if (!user) {
      throw createHttpError('User not found', 404);
    }

    const bookingProfile = await getUserBookingProfile(user._id);
    const verificationBreakdown = getVerificationBreakdown(user);

    response.json({
      user: {
        id: user._id,
        name: user.name,
        fullName: user.name,
        username: user.username || null,
        email: user.email,
        phone: user.phone || '',
        isActive: Boolean(user.isActive !== false),
        cccdNumber: user.cccdNumber || null,
        cccdImageDataUrl: user.cccdImageDataUrl || '',
        faceImageDataUrl: user.faceImageDataUrl || '',
        isCccdVerified: Boolean(user.isCccdVerified),
        cccdNameMatched: verificationBreakdown.nameMatched,
        cccdNameVerifiedAt: user.cccdNameVerifiedAt,
        faceMatched: verificationBreakdown.faceMatched,
        faceMatchScore: verificationBreakdown.faceSimilarityScore,
        faceVerifiedAt: user.faceVerifiedAt,
        verificationBreakdown,
        idCardVerifiedAt: user.idCardVerifiedAt,
        trustScore: Number(user.trustScore || 0),
        successfulBookingCount: bookingProfile.successfulBookingCount,
        isLoyalGuest: bookingProfile.isLoyalGuest,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyCccd(request, response, next) {
  try {
    const validation = validateVerifyCccdPayload(request.body);

    if (!validation.valid) {
      throw createHttpError(validation.errors[0], 400);
    }

    const accountUser = await User.findById(request.auth.userId).select('_id name trustScore');
    if (!accountUser) {
      throw createHttpError('Không tìm thấy tài khoản cần xác minh', 404);
    }

    const uploadedImage = readUploadedImage(request, 'cccdImage', validation.data.cccdImageDataUrl);
    const uploadedFaceImage = readUploadedImage(request, 'faceImage', validation.data.faceImageDataUrl);

    if (!uploadedImage?.buffer) {
      throw createHttpError('Vui lòng tải lên hình ảnh CCCD để xác minh', 400);
    }

    if (!uploadedFaceImage?.buffer) {
      throw createHttpError('Vui lòng tải lên ảnh chân dung để đối sánh khuôn mặt với CCCD', 400);
    }

    const scanResult = await scanCccdImage(uploadedImage.buffer);
    const cccdAssessment = await assessCccdImageSuitability(uploadedImage.buffer, scanResult);

    if (!cccdAssessment.accepted) {
      throw createHttpError(`Ảnh CCCD không hợp lệ hoặc nghi ngờ không đúng: ${cccdAssessment.reasons[0]}`, 400);
    }

    const extractedName = chooseBestDetectedName(accountUser.name, scanResult.detectedNames);
    const nameMatched = namesAreEquivalent(accountUser.name, extractedName);
    const cccdNumber = validation.data.cccdNumber || scanResult.detectedCccdNumber;
    const cccdImageDataUrl = buildImageDataUrl(uploadedImage);
    const faceImageDataUrl = buildImageDataUrl(uploadedFaceImage);

    if (!extractedName) {
      throw createHttpError('Không đọc được họ và tên trên CCCD. Hãy tải ảnh rõ hơn', 400);
    }

    if (!nameMatched) {
      throw createHttpError(`Họ và tên trên CCCD (${extractedName}) không trùng với tên tài khoản (${accountUser.name})`, 400);
    }

    if (!cccdNumber) {
      throw createHttpError('Không đọc được số CCCD. Hãy nhập bổ sung số CCCD hoặc tải ảnh rõ hơn', 400);
    }

    const duplicated = await User.findOne({
      cccdNumber,
      _id: { $ne: request.auth.userId },
    }).lean();

    if (duplicated) {
      throw createHttpError('CCCD đã được sử dụng bởi tài khoản khác', 409);
    }

    const faceVerification = await compareFaceWithCccd({
      cccdBuffer: uploadedImage.buffer,
      selfieBuffer: uploadedFaceImage.buffer,
    });

    if (!faceVerification.accepted) {
      throw createHttpError(faceVerification.rejectionReason || 'Ảnh khuôn mặt không phù hợp để đối sánh', 400);
    }

    const verificationBreakdown = {
      nameMatched,
      faceMatched: Boolean(faceVerification.matched),
      nameScore: nameMatched ? 40 : 0,
      faceScore: faceVerification.matched ? 40 : 0,
      totalScore: (nameMatched ? 40 : 0) + (faceVerification.matched ? 40 : 0),
      faceSimilarityScore: Number(faceVerification.similarityScore || 0),
      faceMatchThreshold: Number(faceVerification.threshold || 50),
    };
    const now = new Date();

    accountUser.cccdNumber = cccdNumber;
    accountUser.cccdImageDataUrl = cccdImageDataUrl;
    accountUser.faceImageDataUrl = faceImageDataUrl;
    accountUser.cccdNameMatched = nameMatched;
    accountUser.cccdNameVerifiedAt = nameMatched ? now : null;
    accountUser.faceMatched = Boolean(faceVerification.matched);
    accountUser.faceMatchScore = verificationBreakdown.faceSimilarityScore;
    accountUser.faceVerifiedAt = now;
    accountUser.isCccdVerified = verificationBreakdown.totalScore >= 80;
    accountUser.idCardVerifiedAt = accountUser.isCccdVerified ? now : null;
    accountUser.trustScore = Math.max(Number(accountUser.trustScore || 0), verificationBreakdown.totalScore);
    await accountUser.save();

    const user = accountUser.toObject();

    if (!user) {
      throw createHttpError('Không tìm thấy tài khoản', 404);
    }

    response.json({
      message: buildVerificationMessage(verificationBreakdown),
      cccdNumber: user.cccdNumber,
      cccdImageDataUrl: user.cccdImageDataUrl,
      faceImageDataUrl: user.faceImageDataUrl,
      trustScore: user.trustScore,
      verifiedAt: user.idCardVerifiedAt,
      cccdNameVerifiedAt: user.cccdNameVerifiedAt,
      faceVerifiedAt: user.faceVerifiedAt,
      extractedName,
      accountName: accountUser.name,
      nameMatched,
      faceMatched: verificationBreakdown.faceMatched,
      faceMatchScore: verificationBreakdown.faceSimilarityScore,
      verificationBreakdown,
      cccdQuality: cccdAssessment,
      faceMetrics: faceVerification.metrics,
    });
  } catch (error) {
    next(error);
  }
}

export async function sendPasswordResetOtp(request, response, next) {
  try {
    const validation = validateSendResetOtpPayload(request.body);

    if (!validation.valid) {
      throw createHttpError(validation.errors[0], 400);
    }

    const { email } = validation.data;
    const user = await User.findOne({ email });

    if (!user) {
      throw createHttpError('Không tìm thấy tài khoản với email này', 404);
    }

    const otp = generateOtpCode();
    const otpHash = hashOtp(otp);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    user.passwordResetOtpHash = otpHash;
    user.passwordResetOtpExpiresAt = otpExpiresAt;
    await user.save();

    try {
      await sendPasswordResetOtpEmail({ toEmail: email, otp });
    } catch (mailError) {
      user.passwordResetOtpHash = '';
      user.passwordResetOtpExpiresAt = null;
      await user.save();
      throw mailError;
    }

    response.json({
      message: 'Đã gửi mã OTP về Gmail của bạn',
      expiresInMinutes: 10,
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPasswordWithOtp(request, response, next) {
  try {
    const validation = validateResetPasswordWithOtpPayload(request.body);

    if (!validation.valid) {
      throw createHttpError(validation.errors[0], 400);
    }

    const { email, otp, newPassword } = validation.data;
    const user = await User.findOne({ email });

    if (!user) {
      throw createHttpError('Không tìm thấy tài khoản với email này', 404);
    }

    if (!user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
      throw createHttpError('Bạn chưa gửi mã OTP', 400);
    }

    if (user.passwordResetOtpExpiresAt.getTime() < Date.now()) {
      throw createHttpError('Mã OTP đã hết hạn', 400);
    }

    if (user.passwordResetOtpHash !== hashOtp(otp)) {
      throw createHttpError('Mã OTP không đúng', 400);
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordResetOtpHash = '';
    user.passwordResetOtpExpiresAt = null;
    await user.save();

    response.json({
      message: 'Đặt lại mật khẩu thành công bằng mã OTP',
    });
  } catch (error) {
    next(error);
  }
}
