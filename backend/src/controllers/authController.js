import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { signAccessToken } from '../services/tokenService.js';
import {
  validateChangePasswordByCccdPayload,
  validateLoginPayload,
  validateRegisterPayload,
  validateVerifyCccdPayload,
} from '../validators/authValidator.js';

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
      cccdNumber: user.cccdNumber || null,
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
      const error = new Error(validation.errors[0]);
      error.statusCode = 400;
      throw error;
    }

    const { fullName, username, phone, email, password } = validation.data;
    const existingUser = await User.findOne({
      $or: [{ email }, ...(username ? [{ username }] : [])],
    }).lean();

    if (existingUser) {
      const error = new Error('Email hoặc username đã tồn tại');
      error.statusCode = 409;
      throw error;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: fullName,
      username: username || undefined,
      phone: phone || '',
      email,
      passwordHash,
      role: 'member',
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
      const error = new Error(validation.errors[0]);
      error.statusCode = 400;
      throw error;
    }

    const { identifier, password } = validation.data;
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);

    if (!validPassword) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    response.json(createAuthResponse(user));
  } catch (error) {
    next(error);
  }
}

export async function getProfile(request, response, next) {
  try {
    const user = await User.findById(request.auth.userId).select(
      '_id name username email phone role cccdNumber isCccdVerified idCardVerifiedAt trustScore',
    );

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    response.json({
      user: {
        id: user._id,
        name: user.name,
        fullName: user.name,
        username: user.username || null,
        email: user.email,
        phone: user.phone || '',
        cccdNumber: user.cccdNumber || null,
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
      const error = new Error(validation.errors[0]);
      error.statusCode = 400;
      throw error;
    }

    const { cccdNumber } = validation.data;

    const duplicated = await User.findOne({
      cccdNumber,
      _id: { $ne: request.auth.userId },
    }).lean();

    if (duplicated) {
      const error = new Error('CCCD đã được sử dụng bởi tài khoản khác');
      error.statusCode = 409;
      throw error;
    }

    const user = await User.findByIdAndUpdate(
      request.auth.userId,
      {
        $set: {
          cccdNumber,
          isCccdVerified: true,
          idCardVerifiedAt: new Date(),
          trustScore: 80,
        },
      },
      { new: true },
    ).lean();

    if (!user) {
      const error = new Error('Không tìm thấy tài khoản');
      error.statusCode = 404;
      throw error;
    }

    response.json({
      message: 'Xác thực CCCD thành công',
      cccdNumber: user.cccdNumber,
      trustScore: user.trustScore,
      verifiedAt: user.idCardVerifiedAt,
    });
  } catch (error) {
    next(error);
  }
}

export async function changePasswordByCccd(request, response, next) {
  try {
    const validation = validateChangePasswordByCccdPayload(request.body);

    if (!validation.valid) {
      const error = new Error(validation.errors[0]);
      error.statusCode = 400;
      throw error;
    }

    const { email, cccdNumber, newPassword } = validation.data;

    const user = await User.findOne({ email, cccdNumber });

    if (!user) {
      const error = new Error('Email hoặc CCCD không đúng');
      error.statusCode = 404;
      throw error;
    }

    if (!user.isCccdVerified) {
      const error = new Error('Tài khoản chưa xác thực CCCD');
      error.statusCode = 400;
      throw error;
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    response.json({
      message: 'Đổi mật khẩu thành công qua xác thực CCCD',
    });
  } catch (error) {
    next(error);
  }
}
