const authService = require("../services/authService");

const authController = {
  register: async (req, res) => {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({ success: true, ...result });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  },

  login: async (req, res) => {
    try {
      const result = await authService.login(req.body);
      res.json({ success: true, ...result });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  },

  getMe: async (req, res) => {
    try {
      const user = await authService.getMe(req.user._id);
      res.json({ success: true, data: user });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  },
};

module.exports = authController;
