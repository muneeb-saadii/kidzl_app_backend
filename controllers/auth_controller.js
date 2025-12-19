// controllers/auth_controller.js
const db = require('../utils/connect_db');
const { successResponseModule, successResponse, errorResponse } = require('../models/base_model');
const { omitPassword, omitPasswords } = require('../utils/general_functions');

const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;


// SIGNUP
exports.signup = async (req, res) => {
  const { full_name, email, password } = req.body;

  if (!full_name || !email || !password) {
    return res.json(errorResponse('name, email and password are required'));
  }
  console.log('executed');

  // Check if email already exists
  const checkSql = 'SELECT id FROM profiles WHERE email = ? LIMIT 1';
  db.query(checkSql, [email], async (err, results) => {
    if (err) {
      console.error('DB error on checking email', err);
      return res.json(errorResponse('Database error'));
    }

    if (results.length > 0) {
      return res.json(errorResponse('Email already exists'));
    }

    // Hash password before storing
    // COMMENT THE NEXT LINE FOR TESTING WITHOUT BCRYPT
    // const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    // UNCOMMENT THE NEXT LINE FOR TESTING WITHOUT BCRYPT
    const hashedPassword = password;

    const now = Date.now();
    const insertSql = 'INSERT INTO profiles (email, password, full_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)';
    
    db.query(insertSql, [email, hashedPassword, full_name, now, now], (err, result) => {
      if (err) {
        console.error('DB error on signup', err);
        return res.json(errorResponse('Database error'));
      }

      const getUserSql = 'SELECT id, email, full_name, phone, gender, role, number_of_children, profile_image_url, created_at, updated_at FROM profiles WHERE id = ?';
      db.query(getUserSql, [result.insertId], (err, userResults) => {
        if (err) {
          console.error('DB error on fetching user', err);
          return res.json(errorResponse('Database error'));
        }

        return res.json(successResponseModule(1, 'Signup successful', userResults[0]));
      });
    });
  });
};

// SIGNIN
exports.signin = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json(errorResponse('email and password are required'));
  }

  const sql = 'SELECT * FROM profiles WHERE email = ? LIMIT 1';
  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error('DB error on signin', err);
      return res.json(errorResponse('Database error'));
    }

    if (results.length === 0) {
      return res.json(errorResponse('Invalid email or password'));
    }

    const user = results[0];

    // Compare password with hashed password
    // COMMENT THE NEXT 3 LINES FOR TESTING WITHOUT BCRYPT
    // const isPasswordValid = await bcrypt.compare(password, user.password);
    // if (!isPasswordValid) {
    //   return res.json(errorResponse('Invalid email or password'));
    // }

    // UNCOMMENT THE NEXT 3 LINES FOR TESTING WITHOUT BCRYPT
    if (password !== user.password) {
      return res.json(errorResponse('Invalid email or password'));
    }

    // Remove password from response
    delete user.password;

    return res.json(successResponseModule(1, 'Signin successful', user));
  });
};

// UPDATE PROFILE
exports.updateProfile = (req, res) => {
  const { userId, full_name, phone, gender, role, number_of_children, profile_image_url } = req.body;

  if (!userId) {
    return res.json(errorResponse('userId is required'));
  }

  // Build dynamic update query
  const updates = [];
  const values = [];

  if (full_name !== undefined) {
    updates.push('full_name = ?');
    values.push(full_name);
  }
  if (phone !== undefined) {
    updates.push('phone = ?');
    values.push(phone);
  }
  if (gender !== undefined) {
    updates.push('gender = ?');
    values.push(gender);
  }
  if (role !== undefined) {
    updates.push('role = ?');
    values.push(role);
  }
  if (number_of_children !== undefined) {
    updates.push('number_of_children = ?');
    values.push(number_of_children);
  }
  if (profile_image_url !== undefined) {
    updates.push('profile_image_url = ?');
    values.push(profile_image_url);
  }

  if (updates.length === 0) {
    return res.json(errorResponse('No fields to update'));
  }

  // Add updated_at timestamp
  updates.push('updated_at = ?');
  values.push(Date.now());

  // Add userId for WHERE clause
  values.push(userId);

  const sql = `UPDATE profiles SET ${updates.join(', ')} WHERE id = ?`;

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('DB error on update profile', err);
      return res.json(errorResponse('Database error'));
    }

    if (result.affectedRows === 0) {
      return res.json(errorResponse('User not found'));
    }

    // Fetch updated user data
    const getUserSql = 'SELECT id, email, full_name, phone, gender, role, number_of_children, profile_image_url, created_at, updated_at FROM profiles WHERE id = ?';
    db.query(getUserSql, [userId], (err, userResults) => {
      if (err) {
        console.error('DB error on fetching updated user', err);
        return res.json(errorResponse('Database error'));
      }

      return res.json(successResponseModule(1, 'Profile updated successfully', userResults[0]));
    });
  });
};