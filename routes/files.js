const express = require("express");
const fileController = require("../controllers/file");
const router = express.Router();

router.post("/upload/",fileController.upload);
router.delete("/delete/",fileController.deleteFile)
router.patch("/rename",fileController.renameFile)
router.get('/fileInfo/:id',fileController.getFileInfo)
module.exports = router