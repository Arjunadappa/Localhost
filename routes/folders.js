const express = require('express');
const folderController = require('../controllers/folder');
const router = express.Router();
const authMiddleware = require("../middleware/auth")

router.post('/upload',authMiddleware,folderController.uploadFolder);
router.delete('/delete',authMiddleware,folderController.deleteFolder);
router.delete('/delete-all',authMiddleware,folderController.deleteAll);
router.patch('/rename',authMiddleware,folderController.rename);
router.get('/get-info/:id',authMiddleware,folderController.getInfo);
router.get('/get-subfolders',authMiddleware,folderController.getSubFolders);
router.get("/list", authMiddleware, folderController.getFolderList);
router.patch("/move", authMiddleware, folderController.moveFolder);
module.exports = router