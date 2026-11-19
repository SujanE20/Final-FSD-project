import User from '../models/User.js';

export async function updateProfile(req, res, next) {
  const { name, email } = req.body;
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) {
    return res.status(400).json({ message: 'Name must be between 2 and 80 characters.' });
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.length > 254) {
    return res.status(400).json({ message: 'Enter a valid email address.' });
  }
  try {
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: { name: name.trim(), email: email.trim().toLowerCase() } },
      { new: true, runValidators: true },
    );
    return res.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'That email is already in use.' });
    return next(error);
  }
}
