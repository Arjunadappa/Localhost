const S3Service = require("../service/S3Service");
const UserModel = require("../models/user");
const bcrypt = require('bcrypt')

exports.createUser = async (req,res) => {
    try{
        let userData = req.body;
        const user = new UserModel(userData);
        await user.save()
        await user.generateEncryptionKeys();
        const token = await user.generateAuthToken();
        if (!user || !token) throw new InternalServerError("Could Not Create New User Error");
        user.tokens = [];
        user.tempTokens = []
        user.password = '';
        user.privateKey = undefined;
        user.publicKey = undefined;
        res.status(200).send({user, token})
    }catch (e) {
        const code = e.code
        console.log(e.message, e.exception)
        return res.status(code).send();

    }
    

}
exports.login = async (req,res) => {
    try {
        let userData = req.body;
        const user = await UserModel.findByCredentials(userData.email,userData.password);
        const token = await user.generateAuthToken();
        if (!user || !token) throw new NotFoundError("Login User Not Found Error");
        user.tokens = [];
        user.tempTokens = []
        user.password = '';
        user.privateKey = undefined;
        user.publicKey = undefined;
        res.status(200).send({user, token})

    } catch (e) {
        const code = e.code
        console.log(e.message, e.exception)
        return res.status(code).send();
    }
}
exports.getUser = async (req,res) => {
    try {
        const user = req.user;
        user.tokens = [];
        user.tempTokens = [];
        user.password = '';
        user.privateKey = undefined;
        user.publicKey = undefined;
        res.send(user);
    } catch (error) {
        res.status(500).send(error)
    }
    
}

exports.logout = async (req,res) => {
    if(!req.user){
        return;
    }
    try {
        const user = req.user;
        const userToken = req.encryptedToken;
        user.tokens = user.tokens.filter((token) => {
            return token.token !== userToken;
        })
        await user.save();
        res.send();

    } catch (e) {
        const code = e.code
        console.log(e.message, e.exception)
        return res.status(code).send();
    }
}

exports.changePassword = async (req,res) => {
    try {
        const user = req.user;
        const isMatch = await bcrypt.compare(req.body.oldPassword, user.password);
        if (!isMatch) throw new Error("Change Passwords Do Not Match Error");
        const encryptionKey = user.getEncryptionKey()
        user.password = req.body.newPassword
        user.tokens = [];
        user.tempTokens = [];
        
        await user.save();
        await user.changeEncryptionKey(encryptionKey);
        const newToken = await user.generateAuthToken();
        res.send({newToken})
    } catch (e) {
        const code = e.code
        console.log(e.message, e.exception)
        return res.status(code).send();
    }
}

exports.deleteTokens = async (req,res) => {
    try {
        const user = req.user;
        user.tokens = [];
        user.tempTokens = [];
        user.save();
        res.send()
    } catch (error) {
        const code = e.code
        console.log(e.message, e.exception)
        return res.status(code).send();
    }
}
