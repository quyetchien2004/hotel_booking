import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { signAccessToken } from '../services/tokenService.js';
import { validateLoginPayload, validateRegisterPayload } from '../validators/authValidator.js';

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
      email: user.email,
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

    const { name, email, password } = validation.data;
    const existingUser = await User.findOne({ email }).lean();

    if (existingUser) {
      const error = new Error('Email already exists');
      error.statusCode = 409;
      throw error;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: 'member',
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

    const { email, password } = validation.data;
    const user = await User.findOne({ email });

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
    const user = await User.findById(request.auth.userId).select('_id name email role');

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    response.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
}
