const express = require('express');
const userController = require('../controller/UserController');
const { authenticateJWT } = require('../middleware/auth-middleware');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/login', userController.login);
router.post('/register', userController.register);
router.get('/logout', authenticateJWT, userController.logout);
router.get('/profile', authenticateJWT, userController.getProfileUser);
router.get('/:id', authenticateJWT, userController.readUser);
router.put('/:id', authenticateJWT, userController.updateUser);
router.post('/reset-pw', userController.resetPassword);


module.exports = router;
