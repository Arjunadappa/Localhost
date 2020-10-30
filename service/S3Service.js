const File = require("../models/file");
const BusboyData = require("../utils/BusboyData");
const awaitUploadStreamS3 = require("./utils/awaitUploadStreamS3.js")
const deleteChunkS3 = require('./utils/DeleteChunkS3')
const uuid  = require("uuid");
const mongoose = require('../server');
const conn = mongoose.connection;
const videoChecker = require("./utils/isVideo");
const isImage = require("./utils/isImage")
const createThumbnailS3 = require('./utils/createThumbnailS3');
const crypto = require('crypto')
exports.uploadFile = async(user,busboy,req) => {
    const password = user.getEncryptionKey(); 
    if (!password) throw new Error("Invalid Encryption Key")
    const initVect = crypto.randomBytes(16);
    const CIPHER_KEY = crypto.createHash('sha256').update(password).digest()        
    const cipher = crypto.createCipheriv('aes256', CIPHER_KEY, initVect);

    const {file, filename, formData} = await BusboyData.data(busboy);
    console.log(formData);
    const randomS3ID = uuid.v4();
    const parentDirectory = formData.get('parentDirectory') ? formData.get('parentDirectory') : '/';
    const directoryHierarachy = formData.get('directoryHierarachy') ? formData.get('directoryHierarachy') : '/';
    const fileSize = formData.get('fileSize') ? formData.get('fileSize') : 0;
    let hasThumbnail = false;
    let thumbnailID = "";
    const isVideo = videoChecker(filename);


    const params = {
        Bucket: process.env.s3Bucket,
        Body : file.pipe(cipher),
        Key : randomS3ID
    };
    const metadata = {
        parentDirectory,
        directoryHierarachy,
        fileSize,
        owner: user._id,
        hasThumbnail,
        thumbnailID,
        isVideo,
        fileSize,
        IV: initVect,
        s3ID: randomS3ID
    }
    await awaitUploadStreamS3(params);
    const date = new Date();
    const fileTobeUploaded = new File({
        filename,
        length:fileSize,
        uploadDate:date.toISOString(),
        metadata
    })
    await fileTobeUploaded.save()
    const imageCheck = isImage(fileTobeUploaded.filename);
    if(fileTobeUploaded.length < 5242880 && imageCheck){
        const updatedFile = await createThumbnailS3(fileTobeUploaded, filename, user);
        return updatedFile;
    }else{
        console.log('uploaded file bigger than 5mb or not image')
        return fileTobeUploaded;
    }
    

    // await awaitUploadStreamS3(params);
    // return file;
    

}
exports.deleteFile = async(fileId) => {
    const file = await File.findOne({"_id":fileId});
    console.log(file);
    if(!file){
        throw "file doesnt exist"
    }
    const params = {Bucket: process.env.s3Bucket,Key: file.s3ID};
    await deleteChunkS3(params);
    await File.deleteOne({"_id":fileId});
}
