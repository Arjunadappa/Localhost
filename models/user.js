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
userSchema.pre('save',async(next) => {
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
userSchema.static.findByCredentials = async(email, password) => {

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
const User = mongoose.model("User",userSchema);
module.exports = User;


