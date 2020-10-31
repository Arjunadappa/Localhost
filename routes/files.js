const express = require("express");
const fileController = require("../controllers/file");
const authMiddleware = require('../middleware/auth');
const router = express.Router();
//FILE upload,delate,rename,info
router.post("/upload/",authMiddleware,fileController.upload);
router.delete("/delete/",authMiddleware,fileController.deleteFile)
router.patch("/rename",authMiddleware,fileController.renameFile)
router.get('/fileInfo/:id',authMiddleware,fileController.getFileInfo)
//thumbnail
router.get("/thumbnail/:id", authMiddleware, fileController.getThumbnail);//returns Buffer
//router.get("/full-thumbnail/:id", authMiddleware, fileController.getFullThumbnail);
module.exports = router