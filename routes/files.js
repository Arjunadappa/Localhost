const { Route53Resolver } = require("aws-sdk");
const express = require("express");
const fileController = require("../controllers/file");
const authMiddleware = require('../middleware/auth');
const tempauth = require('../middleware/tempAuth')
const router = express.Router();
//FILE upload,delate,rename,info,download
router.post("/upload/",authMiddleware,fileController.upload);
router.delete("/delete/",authMiddleware,fileController.deleteFile)
router.patch("/rename",authMiddleware,fileController.renameFile)
router.get('/fileInfo/:id',authMiddleware,fileController.getFileInfo)//has to further implemented after folders is set up
router.get("/download/:id",authMiddleware,fileController.downloadFile)
//thumbnail
router.get("/thumbnail/:id", authMiddleware, fileController.getThumbnail);//returns Buffer
//router.get("/full-thumbnail/:id", authMiddleware, fileController.getFullThumbnail);

router.get("/download/get-token", authMiddleware, fileController.getDownloadToken);

//access changers
router.patch("/make-public/:id",authMiddleware,fileController.makePublic)
router.get("/public/info/:id/:tempToken", fileController.getPublicInfo);
router.delete("/remove-link/:id", authMiddleware, fileController.removeLink);
router.patch("/make-one-public/:id", authMiddleware, fileController.makeOneTimePublic);

//queries
router.get("/list", authMiddleware, fileController.getList);
router.get("/quick-list", authMiddleware, fileController.getQuickList);
module.exports = router