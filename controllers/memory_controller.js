const db = require('../utils/connect_db');
const { successResponseModule, successResponse, errorResponse } = require('../models/base_model');
const { omitPassword, omitPasswords } = require('../utils/general_functions');


// CREATE MEMORY
exports.createMemory = (req, res) => {
  const { userId, child_id, title, description, category, local_image_paths, image_urls, is_favorite, metadata } = req.body;

  const user_id = userId;
  if (!user_id || !title) {
    return res.json(errorResponse('userId and title are required'));
  }

  const now = Date.now();
  
  const sql = `INSERT INTO memories (user_id, child_id, title, description, category, local_image_paths, image_urls, is_favorite, metadata, created_at, updated_at) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const values = [
    user_id,
    child_id || null,
    title,
    description || null,
    category || null,
    local_image_paths ? JSON.stringify(local_image_paths) : null,
    image_urls ? JSON.stringify(image_urls) : null,
    is_favorite || 0,
    metadata ? JSON.stringify(metadata) : null,
    now,
    now
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('DB error on create memory', err);
      return res.json(errorResponse('Database error'));
    }

    // Fetch created memory
    const getMemorySql = 'SELECT * FROM memories WHERE id = ?';
    db.query(getMemorySql, [result.insertId], (err, memoryResults) => {
      if (err) {
        console.error('DB error on fetching memory', err);
        return res.json(errorResponse('Database error'));
      }

      return res.json(successResponseModule(1, 'Memory created successfully', memoryResults[0]));
    });
  });
};

// UPDATE MEMORY
exports.updateMemory = (req, res) => {
  const { memory_id, child_id, title, description, category, local_image_paths, image_urls, is_favorite, metadata } = req.body;

  if (!memory_id) {
    return res.json(errorResponse('memory_id is required'));
  }

  // Build dynamic update query
  const updates = [];
  const values = [];

  if (child_id !== undefined) {
    updates.push('child_id = ?');
    values.push(child_id);
  }
  if (title !== undefined) {
    updates.push('title = ?');
    values.push(title);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    values.push(description);
  }
  if (category !== undefined) {
    updates.push('category = ?');
    values.push(category);
  }
  if (local_image_paths !== undefined) {
    updates.push('local_image_paths = ?');
    values.push(JSON.stringify(local_image_paths));
  }
  if (image_urls !== undefined) {
    updates.push('image_urls = ?');
    values.push(JSON.stringify(image_urls));
  }
  if (is_favorite !== undefined) {
    updates.push('is_favorite = ?');
    values.push(is_favorite);
  }
  if (metadata !== undefined) {
    updates.push('metadata = ?');
    values.push(JSON.stringify(metadata));
  }

  if (updates.length === 0) {
    return res.json(errorResponse('No fields to update'));
  }

  // Add updated_at timestamp
  updates.push('updated_at = ?');
  values.push(Date.now());

  // Add memory_id for WHERE clause
  values.push(memory_id);

  const sql = `UPDATE memories SET ${updates.join(', ')} WHERE id = ?`;

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('DB error on update memory', err);
      return res.json(errorResponse('Database error'));
    }

    if (result.affectedRows === 0) {
      return res.json(errorResponse('Memory not found'));
    }

    // Fetch updated memory
    const getMemorySql = 'SELECT * FROM memories WHERE id = ?';
    db.query(getMemorySql, [memory_id], (err, memoryResults) => {
      if (err) {
        console.error('DB error on fetching memory', err);
        return res.json(errorResponse('Database error'));
      }

      return res.json(successResponseModule(1, 'Memory updated successfully', memoryResults[0]));
    });
  });
};

// DELETE MEMORY
exports.deleteMemory = (req, res) => {
  const { memory_id } = req.body;

  if (!memory_id) {
    return res.json(errorResponse('memory_id is required'));
  }

  const sql = 'DELETE FROM memories WHERE id = ?';

  db.query(sql, [memory_id], (err, result) => {
    if (err) {
      console.error('DB error on delete memory', err);
      return res.json(errorResponse('Database error'));
    }

    if (result.affectedRows === 0) {
      return res.json(errorResponse('Memory not found'));
    }

    return res.json(successResponseModule(1, 'Memory deleted successfully', { memory_id }));
  });
};

// GET SINGLE MEMORY
exports.getMemory = (req, res) => {
  const { memory_id } = req.body;

  if (!memory_id) {
    return res.json(errorResponse('memory_id is required'));
  }

  const sql = 'SELECT * FROM memories WHERE id = ?';

  db.query(sql, [memory_id], (err, results) => {
    if (err) {
      console.error('DB error on get memory', err);
      return res.json(errorResponse('Database error'));
    }

    if (results.length === 0) {
      return res.json(errorResponse('Memory not found'));
    }

    return res.json(successResponseModule(1, 'Memory retrieved successfully', results[0]));
  });
};

// GET MEMORIES BY USER ID
exports.getMemories = (req, res) => {
  const { userId, child_id } = req.body;

  const user_id = userId;

  if (!user_id) {
    return res.json(errorResponse('userId is required'));
  }

  if (!child_id) {
    const sql = 'SELECT * FROM memories WHERE user_id = ? ORDER BY created_at DESC';

    db.query(sql, [user_id], (err, results) => {
        if (err) {
        console.error('DB error on get memories by user', err);
        return res.json(errorResponse('Database error'));
        }

        return res.json(successResponseModule(1, 'Memories retrieved successfully', results));
    });
  }

  const sql = 'SELECT * FROM memories WHERE child_id = ? AND user_id = ? ORDER BY created_at DESC';

  db.query(sql, [child_id, user_id], (err, results) => {
    if (err) {
      console.error('DB error on get memories by child', err);
      return res.json(errorResponse('Database error'));
    }

    return res.json(successResponseModule(1, 'Memories retrieved successfully', results));
  });

  
};
