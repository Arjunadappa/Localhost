const jwt = require("jsonwebtoken");
const UserModel = require("../models/user");

const auth = async (req,res,next) => {
    try {
        const token = req.header("Authorization").replace("Bearer ", "");
        const decoded = jwt.verify(token, process.env.password)
        const iv = decoded.iv;
        const user = await UserModel.findOne({_id: decoded._id})
        const encrpytionKey = user.getEncryptionKey();
        const encryptedToken = user.encryptToken(token, encrpytionKey, iv);

        let tokenExists = false;
        for (let i = 0; i < user.tokens.length; i++) {

            const currentToken = user.tokens[i].token;

            if (currentToken === encryptedToken) {
                tokenExists = true;
                break;
            }
        }
        if (!user || !tokenExists) {
            console.log(user)
            console.log(tokenExists)
            throw new Error("User not found")

        } 
        req.token = token; 
        req.encryptedToken = encryptedToken
        req.user = user;
        next();
    } catch (e) {
        const code = e.code
        console.log(e.message, e.exception)
        return res.status(code).send();
    }
}

module.exports = auth;