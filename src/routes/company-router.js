const express = require('express');
const companyController = require('../controller/CompanyController');
const userController = require('../controller/UserController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth-middleware');
const router = express.Router();
const path = require('path')

router.get('/user/presence/:guid_user', authenticateJWT, companyController.getPresenceForUserInCompany);
router.get('/unit/user/:guid_unit', authenticateJWT, companyController.getUserByUnit);
router.get('/user/presence/graph/:guid_user', authenticateJWT, companyController.getPresenceForUserInCompanyPerYear);
router.post('/login', companyController.login);
router.get('/user', authenticateJWT, companyController.getAllUser); 
router.get('/logout', authenticateJWT, companyController.logout);
router.post('/create-user', authenticateJWT, companyController.createUser);
router.get('/profile', authenticateJWT, companyController.getProfileCompany);
router.put('/profile/:id', authenticateJWT, companyController.updateProfileCompany);
router.put('/user/:id', authenticateJWT, companyController.updateUser);
router.get('/user/:id', authenticateJWT, companyController.getUserById);
router.post('/reset-pw', companyController.resetPassword);
router.delete('/user/:id', authenticateJWT, userController.deleteUser);

module.exports = router;