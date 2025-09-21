const express = require('express');
const router = express.Router();
const authHandler = require('../middleware/authHandler.js');
const appController = require('../controllers/appController.js');


// all routes
router.post('/research', authHandler, appController.triggerResearch);
router.get('/research', authHandler, appController.listAllTopics);
router.get('/research/:id', authHandler, appController.getResultOfTopic);

module.exports = router;