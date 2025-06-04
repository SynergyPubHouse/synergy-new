const express = require('express');

const router = express.Router();
const { registerReviewer, loginReviewer, getProfile, getAssignedManuscripts, submitReview } = require('../controllers/reviewerController');
const auth = require('../middleware/auth');

// Authentication routes
router.post('/register', registerReviewer);
router.post('/login', loginReviewer);

// Protected reviewer routes
router.get('/profile', auth, getProfile);
router.get('/assigned-manuscripts', auth, getAssignedManuscripts);
router.post('/manuscripts/:manuscriptId/review', auth, submitReview);

module.exports = router; 

