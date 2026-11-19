import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordMinLength = 8;
const passwordMaxBytes = 72;
const bcryptRounds = 12;

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

function createToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required to issue authentication tokens.');
  }

  return jwt.sign({}, process.env.JWT_SECRET, {
    subject: user.id,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function validateCredentials({ name, email, password } = {}, includeName) {
  if (includeName && (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80)) {
    return 'Name must be between 2 and 80 characters.';
  }
  if (typeof email !== 'string' || email.length > 254 || !emailPattern.test(email.trim())) {
    return 'Enter a valid email address.';
  }
  if (
    typeof password !== 'string' ||
    password.length < passwordMinLength ||
    Buffer.byteLength(password, 'utf8') > passwordMaxBytes
  ) {
    return 'Password must be at least 8 characters and no more than 72 bytes.';
  }
  return null;
}

export async function register(req, res, next) {
  const validationError = validateCredentials(req.body, true);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const email = req.body.email.trim().toLowerCase();
    const existingUser = await User.exists({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(req.body.password, bcryptRounds);
    const user = await User.create({
      name: req.body.name.trim(),
      email,
      passwordHash,
    });

    return res.status(201).json({
      token: createToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    return next(error);
  }
}

export async function login(req, res, next) {
  const validationError = validateCredentials(req.body, false);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const user = await User.findOne({ email: req.body.email.trim().toLowerCase() })
      .select('+passwordHash');
    const passwordMatches = user
      ? await bcrypt.compare(req.body.password, user.passwordHash)
      : false;

    if (!user || !passwordMatches) {
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }

    return res.json({
      token: createToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    return next(error);
  }
}

export async function getCurrentUser(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({ message: 'This account no longer exists.' });
    }

    return res.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
}
