const express = require('express');
const router = express.Router();
const { registerUser, registerVendor, login } = require('../controllers/authController');
const upload = require('../middleware/uploadMiddleware');

router.post('/register-user', upload.single('image'), registerUser);
router.post('/register-vendor', upload.single('image'), registerVendor);
router.post('/login', login);

module.exports = router;
