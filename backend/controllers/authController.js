import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secretkey123', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { name, username, password } = req.body;
  console.log(`[DEBUG][AUTH] Register attempt — username: "${username}", name: "${name}"`);

  if (!name || !username || !password) {
    console.log(`[DEBUG][AUTH] Register REJECTED — missing fields. name: ${!!name}, username: ${!!username}, password: ${!!password}`);
    return res.status(400).json({ success: false, message: 'Please provide name, username, and password' });
  }

  try {
    const userExists = await User.findOne({ username });
    if (userExists) {
      console.log(`[DEBUG][AUTH] Register REJECTED — username "${username}" already exists (ID: ${userExists._id})`);
      return res.status(400).json({ success: false, message: 'Username is already taken' });
    }

    // Check if it's the very first user; if so, make them an Admin!
    // This makes it easy to set up the system on initial run.
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'user';
    console.log(`[DEBUG][AUTH] Total existing users: ${userCount}. New user will get role: "${role}"`);

    const user = await User.create({
      name,
      username,
      password,
      role,
      status: 'active',
    });

    if (user) {
      console.log(`[DEBUG][AUTH] Register SUCCESS — User created. ID: ${user._id}, role: "${user.role}", username: "${user.username}"`);
      return res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          username: user.username,
          role: user.role,
          token: generateToken(user._id),
        },
      });
    } else {
      console.log(`[DEBUG][AUTH] Register FAILED — User.create returned falsy`);
      return res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(`[DEBUG][AUTH] Register ERROR:`, error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { username, password } = req.body;
  console.log(`[DEBUG][AUTH] Login attempt — username: "${username}"`);

  if (!username || !password) {
    console.log(`[DEBUG][AUTH] Login REJECTED — missing fields. username: ${!!username}, password: ${!!password}`);
    return res.status(400).json({ success: false, message: 'Please provide username and password' });
  }

  try {
    const user = await User.findOne({ username }).populate('team');
    if (!user) {
      console.log(`[DEBUG][AUTH] Login FAILED — no user found with username: "${username}"`);
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    console.log(`[DEBUG][AUTH] User found — ID: ${user._id}, role: "${user.role}", status: "${user.status}", team: ${user.team?.name || 'none'}`);

    if (user.status === 'inactive') {
      console.log(`[DEBUG][AUTH] Login REJECTED — account is deactivated (status: inactive)`);
      return res.status(403).json({ success: false, message: 'Your account is deactivated. Please contact an admin.' });
    }

    const isMatch = await user.matchPassword(password);
    console.log(`[DEBUG][AUTH] Password match result: ${isMatch}`);

    if (isMatch) {
      console.log(`[DEBUG][AUTH] Login SUCCESS — username: "${username}", role: "${user.role}"`);
      return res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          username: user.username,
          role: user.role,
          team: user.team,
          token: generateToken(user._id),
        },
      });
    } else {
      console.log(`[DEBUG][AUTH] Login FAILED — incorrect password for username: "${username}"`);
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
  } catch (error) {
    console.error(`[DEBUG][AUTH] Login ERROR:`, error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Forgot password reset (lightweight)
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  const { username, name, newPassword } = req.body;
  console.log(`[DEBUG][AUTH] Forgot-password attempt — username: "${username}", name: "${name}"`);

  if (!username || !name || !newPassword) {
    console.log(`[DEBUG][AUTH] Forgot-password REJECTED — missing fields`);
    return res.status(400).json({ success: false, message: 'Please provide username, name, and newPassword' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      console.log(`[DEBUG][AUTH] Forgot-password FAILED — no user found with username: "${username}"`);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify if name matches registered name (case-insensitive check)
    if (user.name.toLowerCase() !== name.toLowerCase()) {
      console.log(`[DEBUG][AUTH] Forgot-password FAILED — name mismatch. Expected: "${user.name}", Got: "${name}"`);
      return res.status(400).json({ success: false, message: 'Name and username do not match registration details' });
    }

    // Update password (pre-save hook will hash it automatically)
    user.password = newPassword;
    await user.save();

    console.log(`[DEBUG][AUTH] Forgot-password SUCCESS — password reset for user: "${username}" (ID: ${user._id})`);
    return res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    console.error(`[DEBUG][AUTH] Forgot-password ERROR:`, error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
