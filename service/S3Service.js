const File = require("../models/file");
const Thumbnail = require("../models/thumbnail")
const BusboyData = require("../utils/BusboyData");
const awaitUploadStreamS3 = require("./utils/awaitUploadStreamS3.js")
const deleteChunkS3 = require('./utils/DeleteChunkS3')
const uuid  = require("uuid");
const mongoose = require('../server');
const conn = mongoose.connection;
const videoChecker = require("./utils/isVideo");
const isImage = require("./utils/isImage")
const createThumbnailS3 = require('./utils/createThumbnailS3');
const crypto = require('crypto');
const streamToBuffer = require('./utils/streamToBuffer');
const awaitStream = require('./utils/awaitStream')
const s3 = require("../databases/S3");
const fs = require("fs");
const path = require("path")
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

exports.getThumbnail = async(user, id) => { 

    const password = user.getEncryptionKey();

   if (!password) throw new Error("Invalid Encryption Key")

   const thumbnail = await Thumbnail.findById(id);

   if (thumbnail.owner !== user._id.toString()) {

       throw new Error('Thumbnail Unauthorized Error');
   }

   const iv = thumbnail.IV;
   
   const CIPHER_KEY = crypto.createHash('sha256').update(password).digest()        
   
   const decipher = crypto.createDecipheriv("aes256", CIPHER_KEY, iv);

   const params = {Bucket: process.env.s3Bucket, Key: thumbnail.s3ID};

   const readStream = s3.getObject(params).createReadStream();

   const allStreamsToErrorCatch = [readStream, decipher];

   const bufferData = await streamToBuffer(readStream.pipe(decipher), allStreamsToErrorCatch);

   return bufferData;
} 

exports.getFullThumbnail = async(user,fileID,res) => {
    const userID = user._id;
    const file = await File.findOne({"metadata.owner": userID, "_id": new ObjectID(fileID)});
    if (!file) throw new Error("File Thumbnail Not Found");

    const password = user.getEncryptionKey();
    const IV = file.metadata.IV.buffer;

    if (!password) throw new Error("Invalid Encryption Key")

    const params = {Bucket: process.env.s3Bucket, Key: file.metadata.s3ID};
    const readStream = s3.getObject(params).createReadStream();

    const CIPHER_KEY = crypto.createHash('sha256').update(password).digest()        
    
    const decipher = crypto.createDecipheriv('aes256', CIPHER_KEY, IV);

    res.set('Content-Type', 'binary/octet-stream');
    res.set('Content-Disposition', 'attachment; filename="' + file.filename + '"');
    res.set('Content-Length', file.metadata.size.toString());
    const allStreamsToErrorCatch = [readStream, decipher];
    const data = await awaitStream(readStream.pipe(decipher), res, allStreamsToErrorCatch);
    return data;
    
}

exports.downloadFile = async(user,fileID,res) => {
    const currentFile = await File.findOne({"metadata.owner": user._id, "_id": fileID});
    if (!currentFile) throw new Error("Download File Not Found");

    const password = user.getEncryptionKey();

    if (!password) throw new NotAuthorizedError("Invalid Encryption Key")

    const IV = currentFile.metadata.IV.buffer ;

    const CIPHER_KEY = crypto.createHash('sha256').update(password).digest()        

    const decipher = crypto.createDecipheriv('aes256', CIPHER_KEY, IV);

    res.set('Content-Type', 'binary/octet-stream');
    res.set('Content-Disposition', 'attachment; filename="' + currentFile.filename + '"');
    res.set('Content-Length', currentFile.metadata.fileSize.toString()); 
    const params = {Bucket: process.env.s3Bucket, Key: currentFile.metadata.s3ID};
    const s3ReadStream = s3.getObject(params).createReadStream();
    const allStreamsToErrorCatch = [s3ReadStream, decipher];
    await awaitStream(s3ReadStream.pipe(decipher), res, allStreamsToErrorCatch);
}