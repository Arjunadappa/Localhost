const express = require('express');
const UserController = require('../controllers/user');
const authMiddleware = require('../middleware/auth')
const router = express.Router();
const userController = new UserController();

router.post("/create", userController.createUser);
router.post("/login",userController.login);
router.post('/logout',authMiddleware,userController.logout)
router.get('/me',authMiddleware,userController.getUser)
router.post('/deleteTokens',authMiddleware,userController.deleteTokens)
router.post('/changePassword',authMiddleware,userController.changePassword)
module.exports = router;