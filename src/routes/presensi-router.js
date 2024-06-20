const express = require('express');
const presenceController = require('../controller/PresenceController');
const companyController = require('../controller/CompanyController')
const { authenticateJWT} = require('../middleware/auth-middleware');
const router = express.Router();
const path = require('path');

router.use('/image', authenticateJWT, express.static(path.join(__dirname, '../uploads')));
router.post('/create', authenticateJWT, presenceController.createPresence);
router.get('/user/', authenticateJWT, presenceController.readPresence);
router.get('/', authenticateJWT, companyController.getPresenceForUser);
router.get('/rekap/bulan', authenticateJWT, presenceController.rekapPresenceByMonth);
router.get('/rekap/minggu', authenticateJWT, presenceController.rekapPresenceByWeek);
router.get('/rekap/tahun', authenticateJWT, presenceController.rekapPresenceByYear);

module.exports = router;
