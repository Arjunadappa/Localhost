const express = require("express");
const fileController = require("../controllers/file");
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.post("/upload/",authMiddleware,fileController.upload);
router.delete("/delete/",authMiddleware,fileController.deleteFile)
router.patch("/rename",authMiddleware,fileController.renameFile)
router.get('/fileInfo/:id',authMiddleware,fileController.getFileInfo)
module.exports = router