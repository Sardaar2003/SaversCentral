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

  if (!name || !username || !password) {
    return res.status(400).json({ success: false, message: 'Please provide name, username, and password' });
  }

  try {
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Username is already taken' });
    }

    // Check if it's the very first user; if so, make them an Admin!
    // This makes it easy to set up the system on initial run.
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'user';

    const user = await User.create({
      name,
      username,
      password,
      role,
      status: 'active',
    });

    if (user) {
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
      return res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Please provide username and password' });
  }

  try {
    const user = await User.findOne({ username }).populate('team');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'Your account is deactivated. Please contact an admin.' });
    }

    const isMatch = await user.matchPassword(password);
    if (isMatch) {
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
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Forgot password reset (lightweight)
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  const { username, name, newPassword } = req.body;

  if (!username || !name || !newPassword) {
    return res.status(400).json({ success: false, message: 'Please provide username, name, and newPassword' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify if name matches registered name (case-insensitive check)
    if (user.name.toLowerCase() !== name.toLowerCase()) {
      return res.status(400).json({ success: false, message: 'Name and username do not match registration details' });
    }

    // Update password (pre-save hook will hash it automatically)
    user.password = newPassword;
    await user.save();

    return res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
