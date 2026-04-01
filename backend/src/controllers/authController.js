import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { sendPasswordResetOtpEmail, generateOtpCode, hashOtp } from '../services/mailService.js';
import {
  chooseBestDetectedName,
  namesAreEquivalent,
  scanCccdImage,
} from '../services/cccdVerificationService.js';
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

function createAuthResponse(user) {
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
      isCccdVerified: Boolean(user.isCccdVerified),
      trustScore: Number(user.trustScore || 0),
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
      throw createHttpError('Email hoac username da ton tai', 409);
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

    response.status(201).json(createAuthResponse(user));
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
      throw createHttpError('Tai khoan da bi khoa', 403);
    }

    response.json(createAuthResponse(user));
  } catch (error) {
    next(error);
  }
}

export async function getProfile(request, response, next) {
  try {
    const user = await User.findById(request.auth.userId).select(
      '_id name username email phone role isActive cccdNumber cccdImageDataUrl isCccdVerified idCardVerifiedAt trustScore',
    );

    if (!user) {
      throw createHttpError('User not found', 404);
    }

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
        isCccdVerified: Boolean(user.isCccdVerified),
        idCardVerifiedAt: user.idCardVerifiedAt,
        trustScore: Number(user.trustScore || 0),
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

    const accountUser = await User.findById(request.auth.userId).select('_id name trustScore').lean();
    if (!accountUser) {
      throw createHttpError('Khong tim thay tai khoan can xac minh', 404);
    }

    const uploadedImage = request.file?.buffer
      ? {
          buffer: request.file.buffer,
          mimeType: request.file.mimetype || 'image/jpeg',
        }
      : dataUrlToBuffer(validation.data.cccdImageDataUrl);

    if (!uploadedImage?.buffer) {
      throw createHttpError('Vui long tai len hinh anh CCCD de xac minh', 400);
    }

    const scanResult = await scanCccdImage(uploadedImage.buffer);
    const extractedName = chooseBestDetectedName(accountUser.name, scanResult.detectedNames);
    const nameMatched = namesAreEquivalent(accountUser.name, extractedName);
    const cccdNumber = validation.data.cccdNumber || scanResult.detectedCccdNumber;
    const cccdImageDataUrl = buildImageDataUrl(uploadedImage);

    if (!extractedName) {
      throw createHttpError('Khong doc duoc ho va ten tren CCCD. Hay tai anh ro hon', 400);
    }

    if (!nameMatched) {
      throw createHttpError(`Ho va ten tren CCCD (${extractedName}) khong trung voi ten tai khoan (${accountUser.name})`, 400);
    }

    if (!cccdNumber) {
      throw createHttpError('Khong doc duoc so CCCD. Hay nhap bo sung so CCCD hoac tai anh ro hon', 400);
    }

    const duplicated = await User.findOne({
      cccdNumber,
      _id: { $ne: request.auth.userId },
    }).lean();

    if (duplicated) {
      throw createHttpError('CCCD da duoc su dung boi tai khoan khac', 409);
    }

    const user = await User.findByIdAndUpdate(
      request.auth.userId,
      {
        $set: {
          cccdNumber,
          cccdImageDataUrl,
          isCccdVerified: true,
          idCardVerifiedAt: new Date(),
          trustScore: Math.max(Number(accountUser.trustScore || 0), 80),
        },
      },
      { new: true },
    ).lean();

    if (!user) {
      throw createHttpError('Khong tim thay tai khoan', 404);
    }

    response.json({
      message: 'Tai len va xac thuc CCCD thanh cong',
      cccdNumber: user.cccdNumber,
      cccdImageDataUrl: user.cccdImageDataUrl,
      trustScore: user.trustScore,
      verifiedAt: user.idCardVerifiedAt,
      extractedName,
      accountName: accountUser.name,
      nameMatched,
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
      throw createHttpError('Khong tim thay tai khoan voi email nay', 404);
    }

    const otp = generateOtpCode();
    user.passwordResetOtpHash = hashOtp(otp);
    user.passwordResetOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendPasswordResetOtpEmail({ toEmail: email, otp });

    response.json({
      message: 'Da gui ma OTP ve Gmail cua ban',
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
      throw createHttpError('Khong tim thay tai khoan voi email nay', 404);
    }

    if (!user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
      throw createHttpError('Ban chua gui ma OTP', 400);
    }

    if (user.passwordResetOtpExpiresAt.getTime() < Date.now()) {
      throw createHttpError('Ma OTP da het han', 400);
    }

    if (user.passwordResetOtpHash !== hashOtp(otp)) {
      throw createHttpError('Ma OTP khong dung', 400);
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordResetOtpHash = '';
    user.passwordResetOtpExpiresAt = null;
    await user.save();

    response.json({
      message: 'Dat lai mat khau thanh cong bang ma OTP',
    });
  } catch (error) {
    next(error);
  }
}
