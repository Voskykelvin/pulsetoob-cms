const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');
const { Op } = require('sequelize');

class AuthController {
  async register(req, res) {
    try {
      const { username, email, password, firstName, lastName } = req.body;

      const existingUser = await User.findOne({
        where: { [Op.or]: [{ email }, { username }] },
      });

      if (existingUser) {
        return res.status(400).json({
          error: existingUser.email === email ? 'Email already registered' : 'Username already taken',
        });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }

      const user = await User.scope('withPassword').create({
        username, email, password, firstName, lastName,
        role: 'author',
      });

      const token = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);
      await user.update({ refreshToken });

      res.status(201).json({
        success: true,
        data: {
          token, refreshToken,
          user: {
            id: user.id, username: user.username, email: user.email,
            firstName: user.firstName, lastName: user.lastName,
            role: user.role, avatar: user.avatar, isVerified: user.isVerified,
          },
        },
        message: 'Registration successful',
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = await User.scope('withPassword').findOne({
        where: { [Op.or]: [{ email }, { username: email }] },
      });

      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      if (!user.isActive) return res.status(403).json({ error: 'Account is deactivated' });

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) return res.status(401).json({ error: 'Invalid credentials' });

      const token = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);
      await user.update({ refreshToken, lastLogin: new Date() });

      res.json({
        success: true,
        data: {
          token, refreshToken,
          user: {
            id: user.id, username: user.username, email: user.email,
            firstName: user.firstName, lastName: user.lastName,
            role: user.role, avatar: user.avatar, isVerified: user.isVerified,
            permissions: user.permissions, preferences: user.preferences,
          },
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findByPk(decoded.userId);

      if (!user || user.refreshToken !== refreshToken) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      const newToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);
      await user.update({ refreshToken: newRefreshToken });

      res.json({ success: true, data: { token: newToken, refreshToken: newRefreshToken } });
    } catch (error) {
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  }

  async logout(req, res) {
    try {
      await User.update({ refreshToken: null }, { where: { id: req.userId } });
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Logout failed' });
    }
  }

  async me(req, res) {
    try {
      const user = await User.findByPk(req.userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }

  async updateProfile(req, res) {
    try {
      const user = await User.findByPk(req.userId);
      if (!user) return res.status(404).json({ error: 'User not found' });

      const allowedUpdates = ['firstName', 'lastName', 'bio', 'avatar', 'socialLinks', 'preferences'];
      const updates = {};
      allowedUpdates.forEach((field) => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      });

      await user.update(updates);
      res.json({ success: true, data: user, message: 'Profile updated successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new password required' });
      }

      const user = await User.scope('withPassword').findByPk(req.userId);
      const isValid = await user.comparePassword(currentPassword);
      if (!isValid) return res.status(401).json({ error: 'Current password is incorrect' });

      await user.update({ password: newPassword });
      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to change password' });
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const user = await User.findOne({ where: { email } });

      if (user) {
        const resetToken = crypto.randomBytes(32).toString('hex');
        await user.update({
          passwordResetToken: resetToken,
          passwordResetExpires: new Date(Date.now() + 3600000),
        });
      }

      res.json({ success: true, message: 'If email exists, reset link has been sent' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to process request' });
    }
  }

  async resetPassword(req, res) {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ error: 'Token and password required' });
      }

      const user = await User.scope('withPassword').findOne({
        where: {
          passwordResetToken: token,
          passwordResetExpires: { [Op.gt]: new Date() },
        },
      });

      if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' });

      await user.update({ password, passwordResetToken: null, passwordResetExpires: null });
      res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }

  async verifyEmail(req, res) {
    try {
      const user = await User.findOne({ where: { emailVerificationToken: req.params.token } });
      if (!user) return res.status(400).json({ error: 'Invalid verification token' });

      await user.update({ isVerified: true, emailVerificationToken: null });
      res.json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Verification failed' });
    }
  }

  async generateApiKey(req, res) {
    try {
      const apiKey = `pt_${crypto.randomBytes(32).toString('hex')}`;
      await User.update({ apiKey }, { where: { id: req.userId } });
      res.json({ success: true, data: { apiKey } });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate API key' });
    }
  }

  generateAccessToken(user) {
    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  generateRefreshToken(user) {
    return jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );
  }
}

module.exports = new AuthController();