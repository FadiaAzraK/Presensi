const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('../model/superAdminModel');
const { v4: uuidv4 } = require('uuid');

const mongoURI = process.env.DATABASE;

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.log(err));

const seedAdmins = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('superadmin-1', salt);

    const admins = [
      {
        guid: uuidv4(),
        name: 'Super Admin 1',
        email: 'superadmin1@gmail.com',
        password: hashedPassword,
        role: 'Super Admin'
      }
    ];

    await Admin.insertMany(admins);
    console.log('Admins have been seeded');
    mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding admins:', error);
    mongoose.disconnect();
  }
};

seedAdmins();
