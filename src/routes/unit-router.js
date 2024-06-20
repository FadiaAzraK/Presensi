const express = require('express');
const unitController = require('../controller/UnitController');
const { authenticateJWT } = require('../middleware/auth-middleware');
const router = express.Router();

router.get('/:id', authenticateJWT, unitController.getUnitById);
router.get('/', authenticateJWT, unitController.getAllUnitsByCompanyId);
router.post('/create', authenticateJWT, unitController.createUnit);
router.put('/:id', authenticateJWT, unitController.updateUnit);
router.delete('/:id', authenticateJWT, unitController.deleteUnit);


module.exports = router;
