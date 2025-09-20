const express = require('express');
const router = express.Router();
const authHandler = require('../middleware/authHandler.js');
const appController = require('../controllers/appController.js');


// all routes
router.post('/research', authHandler, appController.triggerResearch);
// router.get('/research', appController)



module.exports = router;