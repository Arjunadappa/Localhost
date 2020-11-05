const express = require('express');
const folderController = require('../controllers/folder');
const router = express.Router();
const authMiddleware = require("../middleware/auth")

router.post('/upload',authMiddleware,folderController.uploadFolder);
module.exports = router