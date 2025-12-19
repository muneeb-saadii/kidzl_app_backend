const db = require('../utils/connect_db');
const { successResponseModule, successResponse, errorResponse } = require('../models/base_model');
const { omitPassword, omitPasswords } = require('../utils/general_functions');


exports.addChild = (req, res) => {
  const { userId, name, birthdate, gender, profile_image } = req.body;

  const user_id = userId;

  if (!user_id || !name) {
    return res.json(errorResponse('userId and name are required'));
  }

  const now = Date.now();
  
  const sql = 'INSERT INTO children (user_id, name, birthdate, gender, profile_image, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)';

  const values = [
    user_id,
    name,
    birthdate || null,
    gender || null,
    profile_image || null,
    now,
    now
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('DB error on add child', err);
      return res.json(errorResponse('Database error'));
    }

    // Fetch created child
    const getChildSql = 'SELECT * FROM children WHERE id = ?';
    db.query(getChildSql, [result.insertId], (err, childResults) => {
      if (err) {
        console.error('DB error on fetching child', err);
        return res.json(errorResponse('Database error'));
      }

      return res.json(successResponseModule(1, 'Child added successfully', childResults[0]));
    });
  });
};

// UPDATE CHILD DETAILS
exports.updateChild = (req, res) => {
  const { child_id, name, birthdate, gender, profile_image } = req.body;

  if (!child_id) {
    return res.json(errorResponse('child_id is required'));
  }

  // Build dynamic update query
  const updates = [];
  const values = [];

  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name);
  }
  if (birthdate !== undefined) {
    updates.push('birthdate = ?');
    values.push(birthdate);
  }
  if (gender !== undefined) {
    updates.push('gender = ?');
    values.push(gender);
  }
  if (profile_image !== undefined) {
    updates.push('profile_image = ?');
    values.push(profile_image);
  }

  if (updates.length === 0) {
    return res.json(errorResponse('No fields to update'));
  }

  // Add updated_at timestamp
  updates.push('updated_at = ?');
  values.push(Date.now());

  // Add child_id for WHERE clause
  values.push(child_id);

  const sql = `UPDATE children SET ${updates.join(', ')} WHERE id = ?`;

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('DB error on update child', err);
      return res.json(errorResponse('Database error'));
    }

    if (result.affectedRows === 0) {
      return res.json(errorResponse('Child not found'));
    }

    // Fetch updated child
    const getChildSql = 'SELECT * FROM children WHERE id = ?';
    db.query(getChildSql, [child_id], (err, childResults) => {
      if (err) {
        console.error('DB error on fetching child', err);
        return res.json(errorResponse('Database error'));
      }

      return res.json(successResponseModule(1, 'Child updated successfully', childResults[0]));
    });
  });
};

// GET CHILDREN BY USER
exports.getChildren = (req, res) => {
  const { userId } = req.body;
  const user_id = userId;

  if (!user_id) {
    return res.json(errorResponse('useId is required'));
  }

  const sql = 'SELECT * FROM children WHERE user_id = ? ORDER BY created_at DESC';

  db.query(sql, [user_id], (err, results) => {
    if (err) {
      console.error('DB error on get children', err);
      return res.json(errorResponse('Database error'));
    }

    return res.json(successResponseModule(1, 'Children retrieved successfully', results));
  });
};