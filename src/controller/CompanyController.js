const Presence = require('../models/presenceModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const Company = require('../model/company-model');
const Admin = require('../model/superAdminModel');
const blacklistedTokens = new Set();
const upload = require('../middleware/upload-middleware');
const User = require('../model/user-model');
const Unit = require('../model/unit-model');
const {publishToRabbitMQ} = require('../service/messageBroker/index')

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    let company = await Company.findOne({ email });
    console.log(company);
    if (!company) {
      const admin = await Admin.findOne({ email });
      console.log(admin);
      if (!admin) {
        return res.status(401).send({ status: "false", code: 401, message: 'Invalid email or password.' });
      } else {
        const validPassword = await bcrypt.compare(password, admin.password);
        if (!validPassword) {
          return res.status(401).send({ status: "false", code: 401, message: 'Invalid email or password.' });
        }
        const token = jwt.sign({
          _id: admin._id,
          guid: admin.guid,
          email: admin.email,
          password: admin.password,
          role: admin.role,
          name: admin.name,
        }, 'secretPresenceToken', { expiresIn: '1d' });
        return res.status(200).send({ status: "true", code: 200, message: "Login successful", token });
      }
    } else {  
      // if (!company.status) {
      //   return res.status(403).send({ status: "false", code: 403, message: 'Company is not subscribed.' });
      // }
      const validPassword = await bcrypt.compare(password, company.password);
      if (!validPassword) {
        return res.status(400).send({ status: "false", code: 401, message: 'Invalid email or password.' });
      }
      const token = jwt.sign({
        _id: company._id,
        role: company.role,
        name: company.name,
        email: company.email,
        guid_company: company.guid_company,
        code: company.code,
        address: company.address,
        phone_number: company.phone_number,
        status: company.status
      }, 'secretPresenceToken');
      return res.status(200).send({ status: "true", code: 200, message: "Login successful", token });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).send({ status: "false", code: 500, message: 'Internal server error.' });
  }
};

const createCompany = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).send({ status: false, code: 400, message: 'Request body is empty.' });
    }

    const { name, address, email, phone_number, password, status } = req.body;

    if (!password) {
      return res.status(400).send({ status: false, code: 400, message: 'Password is required.' });
    }

    if (typeof password !== 'string' || password.trim() === '') {
      return res.status(400).send({ status: false, code: 400, message: 'Invalid password.' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const company = new Company({
      guid_company: uuidv4(),
      name,
      address,
      email,
      phone_number,
      password: hashedPassword,
      status
    });

    await company.save();

    res.status(201).send({ status: true, code: 201, message: 'Created successfully', company });
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).send({ status: false, code: 500, message: 'Internal server error.' });
  }
};

const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find();
    res.send(companies);
  } catch (error) {
    console.error('Get All Companies Error:', error);
    res.status(500).send('Internal server error.');
  }
};

const deleteCompany = [
  async (req, res) => {
    try {
      const companyId = req.params.id;

      const company = await Company.findByIdAndDelete(companyId);
      if (!company) {
        return res.status(404).send({ status: 'false', code: 404, message: 'User not found.' });
      }
      res.status(200).send({ status: 'true', code: 200, message: 'Deleted successfully' });
    } catch (error) {
      console.error('Delete Error:', error);
      res.status(500).send({ status: 'false', code: 500, message: 'Internal server error.' });
    }
  }
];

const updateCompany =
  async (req, res) => {
    try {
      const companyId = req.params.id;
      const company = await Company.findById(companyId);
      console.log(company);

      if (!company) {
        return res.status(404).send('Company not found.');
      }

      const { name, address, email, password, phone_number, status} = req.body;

      const updateData = {
        name: name || company.name,
        address: address || company.address,
        email: email || company.email,
        phone_number: phone_number || company.phone_number,
        status: status || company.status,
      };

      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      } else {
        updateData.password = company.password;
      }

      await Company.findByIdAndUpdate(companyId, updateData, { new: true });
      res.status(200).send({ status: 'true', code: 200, message: 'Updated successfully', updateData });
    } catch (error) {
      console.error('Update Company Error:', error);
      res.status(500).send('Internal server error.');
    }
  }

const logout = (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  if (!blacklistedTokens.has(token)) {
    blacklistedTokens.add(token);
    res.status(200).json({ status: "true", code: 200, message: 'Logout successful' });
  } else {
    res.status(401).json({ status: "false", code: 401, message: 'Token already blacklisted' });
  }
};

const createUser = [
  upload.single('profile_picture'),
  async (req, res) => {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decodedToken = jwt.verify(token, 'secretPresenceToken');
      const companyId = decodedToken.guid_company;

      const company = await Company.findOne({ guid_company: companyId });
      
      if (!company) {
        return res.status(400).send({ status: 'false', code: 400, message: 'Invalid company code.' });
      }

      if (!company.status) {
        return res.status(403).send({ status: 'false', code: 403, message: 'Company is not subscribed.' });
      }

      let { nik, name, gender, email, phone_number, password, unit } = req.body;
      email = email.toLowerCase();
      unit = unit.toLowerCase();

      if (!password) {
        return res.status(400).send({ status: 'false', code: 400, message: 'Password is required.' });
      }

      let unitGuid;
      if (unit) {
        const foundUnit = await Unit.findOne({ name: unit });
        if (!foundUnit) {
          return res.status(400).send({ status: 'false', code: 400, message: 'Invalid unit name.' });
        }
        unitGuid = foundUnit.guid_unit;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      let user = new User({
        guid_user: uuidv4(),
        guid_company: company.guid_company,
        guid_unit: unitGuid,
        nik,
        name,
        profile_picture: req.file ? `${req.file.filename}` : null,
        gender,
        email,
        phone_number,
        password: hashedPassword,
        unit
      });
      // user = await user.save();
      await publishToRabbitMQ('presensi', user );
      res.status(201).send({ status: 'true', code: 201, message: 'Created successfully', user });
    } catch (error) {
      console.error('Created Error:', error);
      res.status(500).send({ status: 'false', code: 500, message: 'Internal server error.' });
    }
  }
];

const updateUser = [
  upload.single('profile_picture'),
  async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).send({ status: 'false', code: 404, message: 'User not found.' });
      }

      let { nik, name, gender, email, phone_number, password, unit } = req.body;
      if (email) {
        email = email.toLowerCase();
      }

      if (unit) {
        unit = unit.toLowerCase();
      }

      let unitGuid = user.guid_unit;
      
      if (unit) {
        const foundUnit = await Unit.findOne({ name: unit });
        if (!foundUnit) {
          return res.status(400).send({ status: 'false', code: 400, message: 'Invalid unit name.' });
        }
        unitGuid = foundUnit.guid_unit;
      }

      const updateData = {
        id: req.params.id,
        guid_unit: unitGuid,
        nik: nik || user.nik,
        name: name || user.name,
        profile_picture: req.file ? `${req.file.filename}` : user.profile_picture,
        gender: gender || user.gender,
        email: email || user.email,
        phone_number: phone_number || user.phone_number,
        unit: unit || user.unit,
        password: password ? await bcrypt.hash(password, 10) : user.password
      };

      await User.findByIdAndUpdate(userId, updateData, { new: true });
      await publish('presensi', updateData);
      res.status(200).send({ status: 'true', code: 200, message: 'Updated successfully', updateData });
    } catch (error) {
      console.error('Update Error:', error);
      res.status(500).send({ status: 'false', code: 500, message: 'Internal server error.' });
    }
  }
];

const deleteUser = [
  async (req, res) => {
    try {
      const userId = req.params.id;

      const user = await User.findByIdAndDelete(userId);
      if (!user) {
        return res.status(404).send({ status: 'false', code: 404, message: 'User not found.' });
      }
      res.status(200).send({ status: 'true', code: 200, message: 'Deleted successfully' });
    } catch (error) {
      console.error('Delete Error:', error);
      res.status(500).send({ status: 'false', code: 500, message: 'Internal server error.' });
    }
  }
];

const getUserByUnit = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, 'secretPresenceToken');
    const companyId = decodedToken.guid_company;
    const unitId = req.params.guid_unit;

    const user = await User.findOne({ guid_company: companyId, guid_unit: unitId });
    console.log(user);
    if (!user) {
      return res.status(404).send('Pengguna tidak ditemukan dalam perusahaan.');
    }
    const userUnit = await User.find({ guid_unit: user.guid_unit });
    console.log(userUnit);

    res.status(200).send({ status: 'true', code: 200, message: 'get data successfully', userUnit });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal server error.');
  }
};

const getPresenceForUserInCompany = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, 'secretPresenceToken');
    const companyId = decodedToken.guid_company;
    const userId = req.params.guid_user;

    const user = await User.findOne({ guid_company: companyId, guid_user: userId });
    console.log(user);
    if (!user) {
      return res.status(404).send('Pengguna tidak ditemukan dalam perusahaan.');
    }
    const presence = await Presence.find({ guid_user: user.guid_user });
    console.log(presence);

    res.status(200).send({ status: 'true', code: 200, message: 'get data successfully', presence });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal server error.');
  }
};

const getPresenceForUser = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, 'secretPresenceToken');
    const companyId = decodedToken.guid_company;
    const userId = decodedToken.guid_user;

    const user = await User.findOne({ guid_company: companyId, guid_user: userId });
    console.log(user);
    if (!user) {
      return res.status(404).send('Pengguna tidak ditemukan dalam perusahaan.');
    }
    const presence = await Presence.find({ guid_user: user.guid_user });
    console.log(presence);

    res.status(200).send({ status: 'true', code: 200, message: 'get data successfully', presence });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal server error.');
  }
};

const getPresenceForUserInCompanyPerMonth = async (req, res) => {
  try {
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
    const decodedToken = jwt.verify(accessToken, 'secretPresenceToken');
    const companyId = decodedToken.guid_company;
    const userId = req.params.guid_user;

    const user = await User.findOne({ guid_company: companyId, guid_user: userId });
    if (!user) {
      return res.status(404).send('Pengguna tidak ditemukan dalam perusahaan.');
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 0);

    const presenceRecords = await Presence.find({
      guid_user: user.guid_user,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const getWorkDaysInMonth = (year, month) => {
      let workDays = 0;
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { 
          workDays++;
        }
      }
      return workDays;
    };

    const workDays = getWorkDaysInMonth(currentYear, currentMonth);
    const uniquePresenceDates = new Set();
    presenceRecords.forEach(record => {
      if (record.status === 'hadir') {
        const date = new Date(record.createdAt).toISOString().split('T')[0]; 
        uniquePresenceDates.add(date);
      }
    });

    const hadirDays = uniquePresenceDates.size;
    const notHadirDays = workDays - hadirDays;

    const hadirPercentage = ((hadirDays / workDays) * 100).toFixed(2);
    const notHadirPercentage = ((notHadirDays / workDays) * 100).toFixed(2);

    res.send({
      period: 'month',
      month: currentDate.toLocaleString('default', { month: 'long' }),
      totalWorkDays: workDays,
      hadirDays,
      notHadirDays,
      hadirPercentage,
      notHadirPercentage
    });
  } catch (error) {
    console.error('Rekap Presence by Month Error:', error);
    res.status(500).send('Internal server error.');
  }
};

const getPresenceForUserInCompanyPerYear = async (req, res) => {
  try {
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
    const decodedToken = jwt.verify(accessToken, 'secretPresenceToken');
    const companyId = decodedToken.guid_company;
    const userId = req.params.guid_user;

    const user = await User.findOne({ guid_company: companyId, guid_user: userId });
    if (!user) {
      return res.status(404).send('Pengguna tidak ditemukan dalam perusahaan.');
    }

    const currentYear = new Date().getFullYear();
    const presenceByMonth = {};

    const getWorkDaysInMonth = (year, month) => {
      let workDays = 0;
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { 
          workDays++;
        }
      }
      return workDays;
    };

    for (let month = 0; month < 12; month++) {
      const startDate = new Date(currentYear, month, 1);
      const endDate = new Date(currentYear, month + 1, 0);

      const presenceRecords = await Presence.find({
        guid_user: user.guid_user,
        createdAt: { $gte: startDate, $lte: endDate }
      });

      const workDays = getWorkDaysInMonth(currentYear, month);
      const uniquePresenceDates = new Set();
      presenceRecords.forEach(record => {
        if (record.status === 'hadir' || record.status === 'Hadir') {
          const date = new Date(record.createdAt).toISOString().split('T')[0]; 
          uniquePresenceDates.add(date);
        }
      });

      const hadirDays = uniquePresenceDates.size;
      const notHadirDays = workDays - hadirDays;

      const hadirPercentage = ((hadirDays / workDays) * 100).toFixed(2);
      const notHadirPercentage = ((notHadirDays / workDays) * 100).toFixed(2);

      presenceByMonth[startDate.toLocaleString('default', { month: 'long' })] = {
        totalWorkDays: workDays,
        hadirDays,
        notHadirDays,
        hadirPercentage,
        notHadirPercentage
      };
    }

    res.send({
      period: 'year',
      year: currentYear,
      presenceByMonth
    });
  } catch (error) {
    console.error('Rekap Presence by Year Error:', error);
    res.status(500).send('Internal server error.');
  }
};

const getAllUser = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, 'secretPresenceToken');
    const companyId = decodedToken.guid_company;

    const user = await User.find({ guid_company: companyId });

    res.status(200).send({ status: 'true', code: 200, message: 'get data successfully', user });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal server error.');
  }
};

const getUserById = async (req, res) => {
  try {
    const userId = req.params.id; 
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, 'secretPresenceToken');
    const companyId = decodedToken.guid_company;

    const user = await User.findOne({ _id: userId, guid_company: companyId });

    if (!user) {
      return res.status(404).send({ status: 'false', code: 404, message: 'User not found.' });
    }

    res.status(200).send({ status: 'true', code: 200, message: 'Get user data successfully', user });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ status: 'false', code: 500, message: 'Internal server error.' });
  }
};

const getProfileCompany = async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  try {
    const decodedToken = jwt.verify(token, 'secretPresenceToken');
    const { _id } = decodedToken;
    const company = await Company.findById(_id);

    if (!company) {
      return res.status(404).send('Company profile not found.');
    }

    res.send(company);
  } catch (error) {
    console.error('Get Company Profile Error:', error);
    res.status(500).send('Internal server error.');
  }
};

const updateProfileCompany = async (req, res) => {
    try {
      const companyId = req.params.id;
      const company = await Company.findById(companyId);

      if (!company) {
        return res.status(404).send('Company not found.');
      }

      const { name, address, email, password, phone_number} = req.body;

      const updateData = {
        name: name || company.name,
        address: address || company.address,
        email: email || company.email,
        phone_number: phone_number || company.phone_number,
      };

      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      } else {
        updateData.password = company.password;
      }
      
      await Company.findByIdAndUpdate(companyId, updateData, { new: true });
      res.status(200).send({ status: 'true', code: 200, message: 'Updated successfully', updateData });
    } catch (error) {
      console.error('Update Company Error:', error);
      res.status(500).send('Internal server error.');
    }
};

const getCompanyById =  async (req, res) => {
  try {
      const company = await Company.findById(req.params.id);
      res.status(200).json(company);
  } catch (error) {
      res.status(404).json({ message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const company = await Company.findOne({ email });
    console.log('Found company:', company);

    if (!company) {
      console.log('Company not found.');
      return res.status(404).send({status: 'true', code: 200, message: 'Company not found.'});
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('Hashed password:', hashedPassword);

    const updatedCompany = await Company.findByIdAndUpdate(company._id, { password: hashedPassword }, { new: true });
    console.log('Updated company:', updatedCompany);

    if (updatedCompany) {
      return res.status(200).send({ status: true, code: 200, message: 'Password updated successfully.' });
    } else {
      return res.status(500).send({ status: false, code: 500, message: 'Failed to update password.' });
    }
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).send('Internal server error.');
  }
};
module.exports = {
  login,
  createCompany,
  updateCompany,
  logout,
  createUser,
  getAllCompanies,
  getProfileCompany,
  getPresenceForUserInCompany,
  blacklistedTokens,
  getAllUser,
  getCompanyById,
  updateUser,
  deleteUser,
  getUserById,
  getPresenceForUserInCompanyPerMonth,
  getPresenceForUserInCompanyPerYear,
  updateProfileCompany,
  deleteCompany,
  getUserByUnit,
  resetPassword,
  getPresenceForUser,
};