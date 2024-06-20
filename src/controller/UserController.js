const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const Company = require('../model/companyModel');
const User = require('../model/user-model');
const Unit = require('../model/unit-model')
const {publishToRabbitMQ} = require('../service/messageBroker/index')
const multer = require('multer');
const upload = require('../middleware/upload-middleware')
const tokenSelesai = new Set();
const path = require('path')

const register = [
    upload.single('profile_picture'),
    async (req, res) => {
        try {
            let { nik, name, gender, email, phone_number, password, unit, guid_company } = req.body;
            nik = nik;
            name = name;
            gender = gender;
            email = email.toLowerCase();
            phone_number = phone_number;
            password = password;
            unit = unit.toLowerCase();

            const company = await Company.findOne({ code: guid_company });
            if (!company) {
                return res.status(400).send({ status: 'false', code: 400, message: 'Invalid company code.' });
            }

            if (!company.status) {
                return res.status(403).send({ status: 'false', code: 403, message: 'Company is not subscribed.' });
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

            const user = {
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
            };

            const payload = {
                _id: user._id,
                guid_user: user.guid_user,
                guid_company: user.guid_company,
                guid_unit: user.guid_unit,
                nik: user.nik,
                name: user.name,
                profile_picture: user.profile_picture,
                gender: user.gender,
                email: user.email,
                phone_number: user.phone_number,
                password: user.password,
                unit: user.unit,
                role: user.role,
            };
            const token = jwt.sign(payload, 'secretPresenceToken', { expiresIn: '1d' });

            await publishToRabbitMQ('presensi', user);

            res.status(201).send({ status: 'true', code: 201, message: 'Registration successful', token });
        } catch (error) {
            console.error('Register Error:', error);
            res.status(500).send({ status: 'false', code: 500, message: 'Internal server error.' });
        }
    }
];

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        console.log(user);

        if (!user) {
            return res.status(401).send({ status: 'false', code: 401, message: 'No user found with this email.' });
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).send({ status: 'false', code: 401, message: 'Invalid email or password.' });
        }

        const payload = {
            _id: user._id,
            guid_user: user.guid_user,
            guid_company: user.guid_company,
            guid_unit: user.guid_unit,
            nik: user.nik,
            name: user.name,
            profile_picture: user.profile_picture,
            gender: user.gender,
            email: user.email,
            phone_number: user.phone_number,
            unit: user.unit,
            role: user.role, 
        };
        const token = jwt.sign(payload, 'secretPresenceToken', { expiresIn: '1d' });
        
        res.status(200).send({ status: 'true', code: 200, message: 'Login successfully', token });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).send({ status: 'false', code: 500, message: 'Internal server error.' });
    }
};

const readUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send({ status: 404, code: 404, message: 'User not found.' });
        }
        res.status(200).send({ status: 'true', code: 200, message: 'Success Get Data', user });
    } catch (error) {
        console.error('Read User Error:', error);
        res.status(500).send({ status: 500, code: 500, message: 'Internal server error.' });
    }
};

const updateUser = [
    upload.single('profile_picture'),
    async (req, res) => {
    try {
      let { nik, name, gender, email, phone_number, password, unit } = req.body;
      email = email.toLowerCase();
      unit = unit.toLowerCase();
      
      const user = await User.findById(req.params.id);
  
      if (!user) {
        return res.status(404).send('User not found.');
      }
  
      let unitGuid = user.guid_unit;
      
      if (unit) {
        const foundUnit = await Unit.findOne({ name: unit });
        if (!foundUnit) {
          return res.status(400).send({ status: 'false', code: 400, message: 'Invalid unit name.' });
        }
        unitGuid = foundUnit.guid_unit;
      }

      const updatedData = {
        nik,
        name,
        gender,
        email,
        phone_number,
        unit,
        guid_unit: unitGuid
      };
  
      if (req.file) {
        updatedData.profile_picture = req.file.filename;
      } else {
        updatedData.profile_picture = user.profile_picture;
      }
  
      if (password) {
        updatedData.password = await bcrypt.hash(password, 10);
      } else {
        updatedData.password = user.password;
      }
      
      const updateMessage = { id: req.params.id, updatedData };

      console.log(updatedData);
  
      await publishToRabbitMQ('presensi', updateMessage );
  
      res.status(200).send({ status: 'true', code: 200, message: 'User Data update initiated, processing...', user: updateMessage });
    } catch (error) {
      console.error('Update User Error:', error);
      res.status(500).send({ status: 'false', code: 500, message: 'Internal server error.' });
    }
  }
];

const deleteUser = async (req, res) => {
    try {
        const deleteMessage = { id: req.params.id };
        res.status(200).send({ status: 'true', code: 200, message: 'User deletion initiated, processing...' });
    } catch (error) {
        console.error('Delete User Error:', error);
        res.status(500).send({ status: 'false', code: 500, message: 'Internal server error.' });
    }
};

const logout = (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    if (!tokenSelesai.has(token)) {
        tokenSelesai.add(token);
        res.status(200).json({ status: "true", code: 200, message: 'Logout successful' });
    } else {
        res.status(401).json({ status: "false", code: 401, message: 'Token already blacklisted' });
    }
};

const getProfileUser = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    try {
      const decodedToken = jwt.verify(token, 'secretPresenceToken');
      const { _id } = decodedToken;
      console.log({_id});
      const user = await User.findById(_id);
  
      if (!user) {
        return res.status(404).send('User profile not found.');
      }
  
      res.status(200).send({status: 'true', code: 200, message: 'get data successfully', user});
    } catch (error) {
      console.error('Get User Profile Error:', error);
      res.status(500).send('Internal server error.');
    }
  };

  const getProfilePicture = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    try {
        const decodedToken = jwt.verify(token, 'secretPresenceToken');
        const { _id } = decodedToken;
        const user = await User.findById(_id);
        if (!user || !user.profile_picture) {
            return res.status(404).send({ status: 404, code: 404, message: 'Profile picture not found for this user.' });
        }
        const profilePicturePath = path.join(__dirname, '../uploads', user.profile_picture);
        res.sendFile(profilePicturePath);
    } catch (error) {
        console.error('Get Profile Picture Error:', error);
        res.status(500).send({ status: 'false', code: 500, message: 'Internal server error.' });
    }
};

const resetPassword =
  async (req, res) => {
    try {
      const { email, newPassword } = req.body;

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).send('Company not found.');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await Company.findByIdAndUpdate(user._id, { password: hashedPassword }, { new: true });

      res.status(200).send('Password updated successfully.');
    } catch (error) {
      console.error('Reset Password Error:', error);
      res.status(500).send('Internal server error.');
    }
};


module.exports = {
    login,
    register,
    readUser,
    updateUser,
    deleteUser,
    logout,
    tokenSelesai,
    getProfileUser,
    getProfilePicture,
    resetPassword
};