const express = require('express');
const companyController = require('../controller/CompanyController');
const { authenticateJWT, authorizeRole } = require('../middleware/auth-middleware');
const router = express.Router();

router.get('/', authenticateJWT,  companyController.getAllCompanies);
router.get('/:id', authenticateJWT,  companyController.getCompanyById);
router.post('/create', authenticateJWT,  companyController.createCompany);
router.put('/:id', authenticateJWT, companyController.updateCompany);
router.delete('/:id', authenticateJWT, companyController.deleteCompany);

module.exports = router;