const { v4: uuidv4 } = require('uuid');
const Unit = require('../model/unitModel');
const Company = require('../model/company-model');
const jwt = require('jsonwebtoken');

exports.createUnit = async (req, res) => {
  try {
    let { name, entry, exit } = req.body;
    name = name.toLowerCase();
    
    const token = req.headers.authorization;

    if (!token) {
      console.log('No token provided');
      return res.status(401).send('No token provided');
    }

    const tokenParts = token.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      console.log('Invalid token format');
      return res.status(401).send('Invalid token format');
    }

    const accessToken = tokenParts[1];
    const decoded = jwt.verify(accessToken, 'secretPresenceToken');

    const userId = decoded._id.toString();

    const user = await Company.findById(userId);

    if (!user) {
      console.log('No user found with this ID');
      return res.status(400).send('Invalid user.');
    }

    const companyId = user.guid_company;

    const company = await Company.findOne({ guid_company: companyId });

    if (!company) {
      console.log('No company found with this ID');
      return res.status(400).send('Invalid company.');
    }

    const unit = new Unit({ guid_unit: uuidv4(), guid_company: company.guid_company, name, entry, exit });
    const savedUnit = await unit.save();

    const populatedUnit = await Unit.findById(savedUnit._id);

    res.status(201).send({ status: true, code: 201, message: 'Unit created successfully', unit: populatedUnit });
  } catch (error) {
    console.error('Create Unit Error:', error);
    res.status(500).send({ status: false, code: 500, message: 'Internal server error.' });
  }
};

exports.getUnitById = async (req, res) => {
  const unitId = req.params.id;
  try {
    const unit = await Unit.findById(unitId);
    console.log(unit);
    res.status(200).send({status: 'true', code: 200, message: 'get data succesfully', unit});
  } catch (error) {
    console.error('Get Unit by ID Error:', error);
    res.status(500).send('Internal server error.');
  }
};

exports.getAllUnitsByCompanyId = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, 'secretPresenceToken');
    const userId = decodedToken.guid_company;

    const company = await Company.findOne({ guid_company: userId });

    if (!company) {
      console.log('No company found with this ID');
      return res.status(400).send('Invalid company.');
    }

    const units = await Unit.find({ guid_company: userId });
    res.send({status: 'true', code: 200, message: 'get data succsessfull', units });
  } catch (error) {
    console.error('Get All Units by Company ID Error:', error);
    res.status(500).send('Internal server error.');
  }
};

exports.updateUnit = async (req, res) => {
  let { name, entry, exit } = req.body;
  name = name.toLowerCase();
  const unitId = req.params.id;
  const unit = await Unit.findByIdAndUpdate(unitId, {name, entry, exit }, { new: true });
  if (!unit) {
    return res.status(404).send({status: 'false', code: 404, message: 'Unit not found.'});
  }
  res.status(200).send({status: 'true', code: 200, message: 'updated succesfully', unit});
};

exports.deleteUnit = async (req, res) => {
  const unit = await Unit.findByIdAndDelete(req.params.id);
  if (!unit) {
    return res.status(404).send('Unit not found.');
  }
  res.send({status: 'true', code: 200, message: 'deleted successfully'});
};
