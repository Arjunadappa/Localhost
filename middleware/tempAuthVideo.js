const User = require("../models/user");
const jwt = require("jsonwebtoken");

const tempAuthVideo = async(req, res, next) => {

    try {

        const token = req.params.tempToken;

        const decoded = jwt.verify(token, process.env.password);

        const iv = decoded.iv;

        if (req.params.uuid !== decoded.cookie) {

            throw new Error("Cookie mismatch")
        }

        const user = await User.findOne({_id: decoded._id});
        const encrpytionKey = user.getEncryptionKey();

        const encryptedToken = user.encryptToken(token, encrpytionKey, iv);

        let tokenFound = false;
        for (let i = 0; i < user.tempTokens.length; i++) {

            const currentToken = user.tempTokens[i].token;

            if (currentToken === encryptedToken) {
                tokenFound = true;
                break;
            }
        }

        if (!user || !tokenFound) {

            throw new Error("User not found");

        } else {

            await user.save();

            req.user = user;
            req.auth = true;
            req.encryptedTempToken = encryptedToken;
            next();
        }

    } catch (e) {
        console.log(e);
        res.status(401).send();
    }
}

module.exports = tempAuthVideo;