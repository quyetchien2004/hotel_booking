import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { sendPasswordResetOtpEmail, generateOtpCode, hashOtp } from '../services/mailService.js';
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

    const { cccdNumber, cccdImageDataUrl } = validation.data;

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
          trustScore: 80,
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
