const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const User = require('../model/user-model');
const Company = require('../model/company-model');
const {publishToRabbitMQ} = require('../service/messageBroker/index')
const multer = require('multer');
const upload = require('../middleware/upload-middleware');
const Presence = require('../model/presence-model');

exports.createPresence = [
    upload.single('image'),
    async (req, res) => {
        try {
            let { location, address, status, note } = req.body;
            status = status.toLowerCase();
            const token = req.headers.authorization;

            if (!token) return res.status(401).send({ status: 'false', code: 401, message: 'No token provided' });

            const tokenParts = token.split(' ');
            if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') return res.status(401).send({ status: "false", code: 401, message: 'Invalid token format' });

            const accessToken = tokenParts[1];
            const decoded = jwt.verify(accessToken, 'secretPresenceToken');
            const userId = decoded._id.toString();

            const user = await User.findById(userId);
            if (!user) return res.status(400).send({ status: "false", code: 400, message: 'Invalid user.' });

            const companyId = user.guid_company;
            const company = await Company.findOne({ guid_company: companyId });
            if (!company) return res.status(400).send({ status: "false", code: 400, message: 'Invalid company' });

            const presence = {
                guid: uuidv4(),
                guid_company: companyId,
                guid_user: user.guid_user,
                name_user: user.name,
                location,
                address,
                status,
                image: req.file ? `${req.file.filename}` : null,
                note
            };

            await publishToRabbitMQ('presensi', presence );

            res.status(201).send({ status: "true", code: 201, message: 'Presence created', presence });
        } catch (error) {
            console.error('Create Presence Error:', error);
            if (error instanceof jwt.JsonWebTokenError) return res.status(401).send({ status: "false", code: 401, message: 'Invalid Token' });
            res.status(500).send({ status: "false", code: 500, message: 'Internal Server Error.' });
        }
    }
];

exports.readPresence = async (req, res) => {
    try {
        if (!req.headers.authorization) {
            return res.status(401).send({ status: "false", code: 401, message: 'Authorization header is missing.' });
        }

        const token = req.headers.authorization.split(' ')[1];
        if (!token) {
            return res.status(401).send({ status: "false", code: 401, message: 'Token is missing.' });
        }

        const decodedToken = jwt.verify(token, 'secretPresenceToken');
        const guid_company = decodedToken.guid_company;

        if (!guid_company) {
            return res.status(400).send({ status: "false", code: 400, message: 'Invalid token: guid_company is missing.' });
        }

        const presences = await Presence.find({ guid_company });

        res.status(200).send({ status: "true", code: 200, presences });
    } catch (error) {

        console.error('Read Presence Error:', error);
        res.status(500).send({ status: "false", code: 500, message: 'Internal Server Error.' });
    }
};
