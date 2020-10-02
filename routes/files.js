const express = require("express");
const fileController = require("../controllers/file");
const router = express.Router();

router.post("/upload/",fileController.upload);
router.delete("/delete/",fileController.deleteFile)
module.exports = router