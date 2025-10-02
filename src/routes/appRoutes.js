const express = require('express');
const router = express.Router();
const authHandler = require('../middleware/authHandler.js');
const appController = require('../controllers/appController.js');


// all routes
router.post('/research', authHandler, appController.triggerResearch);
router.get('/research', authHandler, appController.listAllTopics);
router.get('/research/topic', authHandler, appController.getTopic);
router.get('/research/result', appController.getResult);


// delete a topic
router.delete('/research/:id', authHandler, appController.deleteTopic);

module.exports = router;