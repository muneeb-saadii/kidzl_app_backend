// routes/authentication.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth_controller');
const memController = require('../controllers/memory_controller');
const childController = require('../controllers/children_controller');
const booksController = require('../controllers/books_controller');
// console.log("req.body:", req.body);

router.post('/signup', authController.signup);
router.post('/login', authController.signin);
router.post('/update-profile', authController.updateProfile);


router.post('/create-memory', memController.createMemory);
router.post('/update-memory', memController.updateMemory);
router.post('/delete-memory', memController.deleteMemory);
router.post('/get-memory', memController.getMemory);
router.post('/get-memories', memController.getMemories);


router.post('/new-child', childController.addChild);
router.post('/update-child-details', childController.updateChild);
router.post('/get-children', childController.getChildren);


router.post('/create-book', booksController.createBook);
router.post('/update-book', booksController.updateBook);
router.post('/delete-book', booksController.deleteBook);
router.post('/add-memory-book', booksController.addMemoryToBook);
router.post('/get-books', booksController.getAllBooks);



module.exports = router;
