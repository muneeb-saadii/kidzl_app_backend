const db = require('../utils/connect_db');
const { successResponseModule, successResponse, errorResponse } = require('../models/base_model');
const { omitPassword, omitPasswords } = require('../utils/general_functions');


exports.createBook = (req, res) => {
  const { userId, name, description, cover_image_url, memory_ids_json, partner_ids_json } = req.body;
  const created_by = userId;

  if (!name || !created_by) {
    return res.json(errorResponse('name and userId are required'));
  }

  const now = Date.now();
  
  const sql = 'INSERT INTO books (name, description, cover_image_url, created_by, memory_ids_json, partner_ids_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

  const values = [
    name,
    description || null,
    cover_image_url || null,
    created_by,
    memory_ids_json ? JSON.stringify(memory_ids_json) : null,
    partner_ids_json ? JSON.stringify(partner_ids_json) : null,
    now,
    now
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('DB error on create book', err);
      return res.json(errorResponse('Database error'));
    }

    // Fetch created book
    const getBookSql = 'SELECT * FROM books WHERE id = ?';
    db.query(getBookSql, [result.insertId], (err, bookResults) => {
      if (err) {
        console.error('DB error on fetching book', err);
        return res.json(errorResponse('Database error'));
      }

      return res.json(successResponseModule(1, 'Book created successfully', bookResults[0]));
    });
  });
};

// UPDATE BOOK
exports.updateBook = (req, res) => {
  const { book_id, name, description, cover_image_url, memory_ids_json, partner_ids_json } = req.body;

  if (!book_id) {
    return res.json(errorResponse('book_id is required'));
  }

  // Build dynamic update query
  const updates = [];
  const values = [];

  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    values.push(description);
  }
  if (cover_image_url !== undefined) {
    updates.push('cover_image_url = ?');
    values.push(cover_image_url);
  }
  if (memory_ids_json !== undefined) {
    updates.push('memory_ids_json = ?');
    values.push(JSON.stringify(memory_ids_json));
  }
  if (partner_ids_json !== undefined) {
    updates.push('partner_ids_json = ?');
    values.push(JSON.stringify(partner_ids_json));
  }

  if (updates.length === 0) {
    return res.json(errorResponse('No fields to update'));
  }

  // Add updated_at timestamp
  updates.push('updated_at = ?');
  values.push(Date.now());

  // Add book_id for WHERE clause
  values.push(book_id);

  const sql = `UPDATE books SET ${updates.join(', ')} WHERE id = ?`;

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('DB error on update book', err);
      return res.json(errorResponse('Database error'));
    }

    if (result.affectedRows === 0) {
      return res.json(errorResponse('Book not found'));
    }

    // Fetch updated book
    const getBookSql = 'SELECT * FROM books WHERE id = ?';
    db.query(getBookSql, [book_id], (err, bookResults) => {
      if (err) {
        console.error('DB error on fetching book', err);
        return res.json(errorResponse('Database error'));
      }

      return res.json(successResponseModule(1, 'Book updated successfully', bookResults[0]));
    });
  });
};

// GET ALL BOOKS
exports.getAllBooks = (req, res) => {
  const { userId } = req.body;
  const user_id = userId;

  if (!user_id) {
    return res.json(errorResponse('userId is required'));
  }

  const sql = 'SELECT * FROM books WHERE created_by = ? ORDER BY created_at DESC';

  db.query(sql, [user_id], (err, results) => {
    if (err) {
      console.error('DB error on get all books', err);
      return res.json(errorResponse('Database error'));
    }

    return res.json(successResponseModule(1, 'Books retrieved successfully', results));
  });
};

// DELETE BOOK
exports.deleteBook = (req, res) => {
  const { book_id, userId } = req.body;

  if (!book_id || !userId) {
    return res.json(errorResponse('userId and book_id are required'));
  }

  const sql = 'DELETE FROM books WHERE id = ?';

  db.query(sql, [book_id], (err, result) => {
    if (err) {
      console.error('DB error on delete book', err);
      return res.json(errorResponse('Database error'));
    }

    if (result.affectedRows === 0) {
      return res.json(errorResponse('Book not found'));
    }

    return res.json(successResponseModule(1, 'Book deleted successfully', { book_id }));
  });
};

// ADD MEMORY TO BOOK
exports.addMemoryToBook = (req, res) => {
  const { book_id, memory_id } = req.body;

  if (!book_id || !memory_id) {
    return res.json(errorResponse('book_id and memory_id are required'));
  }

  // First, fetch the current book to get existing memory_ids_json
  const getBookSql = 'SELECT memory_ids_json FROM books WHERE id = ?';
  
  db.query(getBookSql, [book_id], (err, results) => {
    if (err) {
      console.error('DB error on fetching book', err);
      return res.json(errorResponse('Database error'));
    }

    if (results.length === 0) {
      return res.json(errorResponse('Book not found'));
    }

    const book = results[0];
    let memoryIds = [];

    // Parse existing memory_ids_json
    if (book.memory_ids_json) {
      try {
        memoryIds = JSON.parse(book.memory_ids_json);
        if (!Array.isArray(memoryIds)) {
          memoryIds = [];
        }
      } catch (e) {
        memoryIds = [];
      }
    }

    // Check if memory_id already exists in the array
    if (memoryIds.includes(memory_id)) {
      return res.json(errorResponse('Memory already added to this book'));
    }

    // Add new memory_id to the array
    memoryIds.push(memory_id);

    // Update the book with new memory_ids_json
    const updateSql = 'UPDATE books SET memory_ids_json = ?, updated_at = ? WHERE id = ?';
    
    db.query(updateSql, [JSON.stringify(memoryIds), Date.now(), book_id], (err, result) => {
      if (err) {
        console.error('DB error on updating book', err);
        return res.json(errorResponse('Database error'));
      }

      // Fetch updated book
      const getUpdatedBookSql = 'SELECT * FROM books WHERE id = ?';
      db.query(getUpdatedBookSql, [book_id], (err, bookResults) => {
        if (err) {
          console.error('DB error on fetching updated book', err);
          return res.json(errorResponse('Database error'));
        }

        return res.json(successResponseModule(1, 'Memory added to book successfully', bookResults[0]));
      });
    });
  });
};