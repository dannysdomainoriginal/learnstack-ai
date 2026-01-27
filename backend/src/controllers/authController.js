import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// @desc Register new user
// @route POST /api/auth/register
// @access Public
export const register = async (req, res) => {
  const { username, email, password } = req.body;

  const userExists = await User.findOne({
    // $or: [{ email }, { username }],
    email,
  });

  if (userExists) {
    return res.status(400).json({
      success: false,
      error:
        userExists.email === email
          ? "Email already registered"
          : "Username already taken",
      status: 400,
    });
  }

  const user = await User.create({
    username,
    email,
    password,
  });

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        roles: user.roles,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
      token,
    },
    message: `${user.username} has successfully logged in`,
  });
};

// @desc Login user
// @route POST /api/auth/login
// @access Public
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: "Email and password are required",
      status: 400,
    });
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return res.status(401).json({
      success: false,
      error: "Invalid credentials",
      status: 401,
    });
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error: "Invalid credentials",
      status: 401,
    });
  }

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        roles: user.roles,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
      token,
    },
    message: `Welcome back, ${user.username}!`,
  });
};

// @desc Get user profile
// @route GET /api/auth/profile
// @access Private
export const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    data: {
      id: user._id,
      username: user.username,
      email: user.email,
      roles: user.roles,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
};

// @desc Update user profile
// @route PUT /api/auth/profile
// @access Private
export const updateProfile = async (req, res) => {
  const { username, email, profileImage } = req.body;

  const user = await User.findById(req.user._id);

  if (username?.trim()) user.username = username?.trim();
  if (email?.trim()) user.email = email?.trim();
  if (profileImage) user.profileImage = profileImage;

  await user.save();

  res.status(200).json({
    success: true,
    data: {
      id: user._id,
      username: user.username,
      email: user.email,
      roles: user.roles,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    message: "Profile updated successfully",
  });
};

// @desc Change password
// @route POST /api/auth/change-password
// @access Private
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if ((!currentPassword, !newPassword)) {
    return res.status(400).json({
      success: false,
      error: "Please provide current and new password",
      status: 400,
    });
  }

  const user = await User.findById(req.user._id).select("+password");

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error: "Password is incorrect",
      status: 401,
    });
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password change was successful",
  });
};
