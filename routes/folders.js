const express = require('express');
const folderController = require('../controllers/folder');
const router = express.Router();

router.post('/upload',folderController.uploadFolder);
module.exports = router