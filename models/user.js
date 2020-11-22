const mongoose = require('mongoose');
const crypto = require('crypto');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        trim: true
    },
    email:{
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('not a Valid email');
            }
        }


    },
    password:{
        type: String,
        trim: true,
        required: true,
        validate(value){
            if(value.length < 5){
                throw new Error('length of the password must be greater than 5')
            }
        }
    },
    tokens:[{
        token: {
            type: String,
            required: true,

        }
    }],
    tempTokens: [{
        token: {
            type: String, 
            required: true
        }
    }],
    privateKey: {
        type: String, 
    },
    publicKey: {
        type: String, 
    }

})
userSchema.pre('save',async function(next) {
    const user = this;
    if(user.isModified("password")){
        user.password = await bcrypt.hash(user.password,7);
    }
    next();
})
userSchema.methods.toJSON = function() {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.tokens;
    delete userObject.tempTokens;
    return userObject;
}
userSchema.statics.findByCredentials = async(email, password) => {

    const user = await User.findOne({email});

    if (!user) {

        throw new Error("User not found")
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        console.log("incorrect password")
        throw new Error("Incorrect password");
    }

    return user;
}
userSchema.methods.generateAuthToken = async function() {

    const iv = crypto.randomBytes(16);

    const user = this; 
    let token = jwt.sign({_id:user._id.toString(), iv}, process.env.password);

    const encryptionKey = user.getEncryptionKey();

    const encryptedToken = user.encryptToken(token, encryptionKey, iv);

    user.tokens = user.tokens.concat({token: encryptedToken});

    await user.save();
    return token;
}

userSchema.methods.encryptToken = function(token, key, iv) {

    iv = Buffer.from(iv, "hex")

    const TOKEN_CIPHER_KEY = crypto.createHash('sha256').update(key).digest();
    const cipher = crypto.createCipheriv('aes-256-cbc', TOKEN_CIPHER_KEY, iv);
    const encryptedText = cipher.update(token);

    return Buffer.concat([encryptedText, cipher.final()]).toString("hex");;
}

userSchema.methods.decryptToken = function(encryptedToken, key, iv) {

    encryptedToken = Buffer.from(encryptedToken, "hex");
    iv = Buffer.from(iv, "hex")

    const TOKEN_CIPHER_KEY = crypto.createHash('sha256').update(key).digest();  
    const decipher = crypto.createDecipheriv('aes-256-cbc', TOKEN_CIPHER_KEY, iv)
    
    const tokenDecrypted = decipher.update(encryptedToken);

    return Buffer.concat([tokenDecrypted, decipher.final()]).toString();
}

userSchema.methods.generateEncryptionKeys = async function() {

    const user = this;
    const userPassword = user.password;
    const masterPassword = process.env.key;

    const randomKey = crypto.randomBytes(32);

    const iv = crypto.randomBytes(16);
    const USER_CIPHER_KEY = crypto.createHash('sha256').update(userPassword).digest();
    const cipher = crypto.createCipheriv('aes-256-cbc', USER_CIPHER_KEY, iv);
    let encryptedText = cipher.update(randomKey);
    encryptedText = Buffer.concat([encryptedText, cipher.final()]);

    const MASTER_CIPHER_KEY = crypto.createHash('sha256').update(masterPassword).digest();
    const masterCipher = crypto.createCipheriv('aes-256-cbc', MASTER_CIPHER_KEY, iv);
    const masterEncryptedText = masterCipher.update(encryptedText);

    user.privateKey = Buffer.concat([masterEncryptedText, masterCipher.final()]).toString("hex");
    user.publicKey = iv.toString("hex");

    await user.save();
}

userSchema.methods.getEncryptionKey = function() {

    try {
        const user = this;
        const userPassword = user.password;
        const masterEncryptedText = user.privateKey;
        const masterPassword = process.env.key;
        const iv = Buffer.from(user.publicKey, "hex");

        const USER_CIPHER_KEY = crypto.createHash('sha256').update(userPassword).digest();
        const MASTER_CIPHER_KEY = crypto.createHash('sha256').update(masterPassword).digest();

        const unhexMasterText = Buffer.from(masterEncryptedText, "hex");
        const masterDecipher = crypto.createDecipheriv('aes-256-cbc', MASTER_CIPHER_KEY, iv)
        let masterDecrypted = masterDecipher.update(unhexMasterText);
        masterDecrypted = Buffer.concat([masterDecrypted, masterDecipher.final()])

        let decipher = crypto.createDecipheriv('aes-256-cbc', USER_CIPHER_KEY, iv);
        let decrypted = decipher.update(masterDecrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted;

    } catch (e) {

        console.log("Get Encryption Key Error", e);
        return undefined;
    }
}

userSchema.methods.changeEncryptionKey = async function(randomKey) {

    const user = this;
    const userPassword = user.password;
    const masterPassword = process.env.key;

    const iv = crypto.randomBytes(16);
    const USER_CIPHER_KEY = crypto.createHash('sha256').update(userPassword).digest();
    const cipher = crypto.createCipheriv('aes-256-cbc', USER_CIPHER_KEY, iv);
    let encryptedText = cipher.update(randomKey);
    encryptedText = Buffer.concat([encryptedText, cipher.final()]);

    const MASTER_CIPHER_KEY = crypto.createHash('sha256').update(masterPassword).digest();
    const masterCipher = crypto.createCipheriv('aes-256-cbc', MASTER_CIPHER_KEY, iv);
    const masterEncryptedText = masterCipher.update(encryptedText);

    user.privateKey = Buffer.concat([masterEncryptedText, masterCipher.final()]).toString("hex");
    user.publicKey = iv.toString("hex");

    await user.save();
}

userSchema.methods.generateTempAuthToken = async function() {

    const iv = crypto.randomBytes(16);

    const user = this ; 
    const token = jwt.sign({_id:user._id.toString(), iv}, process.env.password, {expiresIn: "10000ms"});

    const encryptionKey = user.getEncryptionKey();
    const encryptedToken = user.encryptToken(token, encryptionKey, iv);

    user.tempTokens = user.tempTokens.concat({token: encryptedToken});

    await user.save();
    return token;
}

userSchema.methods.generateTempAuthTokenVideo = async function(cookie) {

    const iv = crypto.randomBytes(16);

    const user = this; 
    const token = jwt.sign({_id:user._id.toString(), cookie, iv}, process.env.password, {expiresIn:"5h"});

    const encryptionKey = user.getEncryptionKey();
    const encryptedToken = user.encryptToken(token, encryptionKey, iv);
    
    user.tempTokens = user.tempTokens.concat({token: encryptedToken});
    
    await user.save();
    return token;
}

const User = mongoose.model("User",userSchema);
module.exports = User;


