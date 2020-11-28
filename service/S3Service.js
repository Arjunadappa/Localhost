const File = require("../models/file");
const Folder  =  require("../models/folder");
const User = require("../models/user");
const Thumbnail = require("../models/thumbnail")
const BusboyData = require("../utils/BusboyData");
const awaitUploadStreamS3 = require("./utils/awaitUploadStreamS3.js")
const deleteChunkS3 = require('./utils/DeleteChunkS3')
const uuid  = require("uuid");
const mongoose = require('../databases/mongoose');
const conn = mongoose.connection;
const videoChecker = require("./utils/isVideo");
const isImage = require("./utils/isImage")
const createThumbnailS3 = require('./utils/createThumbnailS3');
const crypto = require('crypto');
const streamToBuffer = require('./utils/streamToBuffer');
const awaitStream = require('./utils/awaitStream')
const s3 = require("../databases/S3");
const fs = require("fs");
const path = require("path");
const fixStartChunkLength = require("../utils/fixStartChunkLength");
const fixEndChunkLength = require("../utils/fixEndChunkLength");
const getPrevIVS3 = require("../utils/getPrevIVS3");
const awaitStreamVideo =  require("../utils/awaitStreamVideo");
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
        createdBy: user._id,
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
    console.log(fileTobeUploaded)
    await fileTobeUploaded.save()
    const imageCheck = isImage(fileTobeUploaded.filename);
    if(fileTobeUploaded.length < 5242880 && imageCheck){
        const updatedFile = await createThumbnailS3(fileTobeUploaded, filename, user);
        console.log(updatedFile)
        return updatedFile;
    }else{
        console.log('uploaded file bigger than 5mb or not image')
        return fileTobeUploaded;
    }
    

    // await awaitUploadStreamS3(params);
    // return file;
    
}
exports.deleteFile = async(userId,fileId) => {
    const file = await File.findOne({"metadata.createdBy": userId,"_id":fileId});
    console.log(file);
    if(!file){
        throw "file doesnt exist"
    }
    if(file.metadata.thumbnailID){
        const thumbnail = await Thumbnail.findById(file.metadata.thumbnailID);
        const paramsThumbnail = {Bucket: process.env.s3Bucket, Key: thumbnail.s3ID};
        await deleteChunkS3(paramsThumbnail);
        await Thumbnail.deleteOne({_id: file.metadata.thumbnailID});
    }
    const params = {Bucket: process.env.s3Bucket,Key: file.metadata.s3ID};
    await deleteChunkS3(params);
    await File.deleteOne({"_id":fileId});
}

exports.getThumbnail = async(user, id) => { 

    const password = user.getEncryptionKey();

   if (!password) throw new Error("Invalid Encryption Key")

   const thumbnail = await Thumbnail.findById(id);

   if (thumbnail.createdBy !== user._id.toString()) {

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
    const file = await File.findOne({"metadata.createdBy": userID, "_id": new ObjectID(fileID)});
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
    const currentFile = await File.findOne({"metadata.createdBy": user._id, "_id": fileID});
    console.log(currentFile)
    if (!currentFile) throw new Error("Download File Not Found");

    const password = user.getEncryptionKey();

    if (!password) throw new NotAuthorizedError("Invalid Encryption Key")

    const IV = currentFile.metadata.IV.buffer ;

    const CIPHER_KEY = crypto.createHash('sha256').update(password).digest()        

    const decipher = crypto.createDecipheriv('aes256', CIPHER_KEY, IV);

    res.set('Content-Type', 'binary/octet-stream');
    res.set('Content-Disposition', 'attachment; filename="' + currentFile.filename + '"');
    //res.set('Content-Length', 'currentFile.metadata.fileSize.toString()'); 
    const params = {Bucket: process.env.s3Bucket, Key: currentFile.metadata.s3ID};
    console.log(s3.getObject(params))
    const s3ReadStream = s3.getObject(params).createReadStream();
    const allStreamsToErrorCatch = [s3ReadStream, decipher];
    await awaitStream(s3ReadStream.pipe(decipher), res, allStreamsToErrorCatch);
}

exports.deleteFolder = async (userID,folderID,directoryHierarachy) => {
    console.log(directoryHierarachy)
    const parentListString = directoryHierarachy.toString()
    const fileList = await conn.db.collection('files').find({"metadata.createdBy": userID, 
    "metadata.directoryHierarachy":  {$regex : `.*${parentListString}.*`}}).toArray();
    console.log(fileList)
    if(!fileList){
       throw new Error('file list not found')
    }
    for (let i = 0; i < fileList.length; i++) {

        const currentFile = fileList[i];

        try {
            
            if (currentFile.metadata.thumbnailID) {

                const thumbnail = await Thumbnail.findById(currentFile.metadata.thumbnailID);
                const paramsThumbnail = {Bucket: process.env.s3Bucket, Key: thumbnail.s3ID};
                await deleteChunkS3(paramsThumbnail);
                await Thumbnail.deleteOne({_id: currentFile.metadata.thumbnailID});
            }
                
            const params= {Bucket: process.env.s3Bucket, Key: currentFile.metadata.s3ID};
            await deleteChunkS3(params);
            await File.deleteOne({_id: currentFile._id});

        } catch (e) {

            console.log(e, currentFile.filename, currentFile._id);
            throw new Error("could not delete file")
        }
       
    }
    await Folder.deleteMany({"createdBy": userID, "directoryHierarachy": { $all: directoryHierarachy}});
    await Folder.deleteMany({"createdBy": userID, "_id": folderID}); 

}

exports.deleteAll = async (userID) => {
    const fileList = await conn.db.collection('files').find({"metadata.createdBy": userID}).toArray();
    console.log(fileList);
    if(!fileList) throw new Error('files and folder could not be fetched');
    for (let i = 0; i < fileList.length; i++) {

        const currentFile = fileList[i];

        try {
            
            if (currentFile.metadata.thumbnailID) {

                const thumbnail = await Thumbnail.findById(currentFile.metadata.thumbnailID);
                const paramsThumbnail = {Bucket: process.env.s3Bucket, Key: thumbnail.s3ID};
                await deleteChunkS3(paramsThumbnail);
                await Thumbnail.deleteOne({_id: currentFile.metadata.thumbnailID});
            }
                
            const params= {Bucket: process.env.s3Bucket, Key: currentFile.metadata.s3ID};
            await deleteChunkS3(params);
            await File.deleteOne({_id: currentFile._id});

        } catch (e) {

            console.log(e, currentFile.filename, currentFile._id);
            throw new Error("could not delete file")
        }
       
    }
    await Folder.deleteMany({"createdBy": userID});
}

exports.getPublicDownload = async (fileID, tempToken, res) => {
        const file = await File.findOne({"_id": fileID});

        if (!file || !file.metadata.link || file.metadata.link !== tempToken) {
            throw new Error("File Not Public");
        }

        const user = await User.findById(file.metadata.createdBy);

        const password = user.getEncryptionKey();

        if (!password) throw new NotAuthorizedError("Invalid Encryption Key");

        const IV = file.metadata.IV.buffer;
                   
        const params = {Bucket: process.env.s3Bucket, Key: file.metadata.s3ID};

        const readStream = s3.getObject(params).createReadStream();
        
        const CIPHER_KEY = crypto.createHash('sha256').update(password).digest()        

        const decipher = crypto.createDecipheriv('aes256', CIPHER_KEY, IV);
    
        res.set('Content-Type', 'binary/octet-stream');
        res.set('Content-Disposition', 'attachment; filename="' + file.filename + '"');
        //res.set('Content-Length', file.metadata.size.toString());

        const allStreamsToErrorCatch = [readStream, decipher];

        await awaitStream(readStream.pipe(decipher), res, allStreamsToErrorCatch);

        if (file.metadata.linkType === "one") {
            console.log("removing public link");
            await File.findOneAndUpdate({"_id":fileID}, {
                "$unset": {"metadata.linkType": "", "metadata.link": ""}})
        }
}

exports.streamVideo = async(user, fileID, headers, res, req) => { 

    const userID = user._id;
    console.log(userID, fileID)
    const currentFile = await conn.db.collection("files")
    .findOne({"metadata.createdBy": userID, "_id": fileID});

    if (!currentFile) throw new Error("Video File Not Found");

    const password = user.getEncryptionKey();

    if (!password) throw new Error("Invalid Encryption Key")

    const fileSize = currentFile.metadata.size;
                
    const range = headers.range
    const parts = range.replace(/bytes=/, "").split("-")
    let start = parseInt(parts[0], 10)
    let end = parts[1] 
        ? parseInt(parts[1], 10)
        : fileSize-1
    const chunksize = (end-start)+1
    const IV = currentFile.metadata.IV.buffer ;
            
    let head = {
        'Content-Range': 'bytes ' + start + '-' + end + '/' + fileSize,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4'}

    let currentIV = IV;

    let fixedStart = start % 16 === 0 ? start : fixStartChunkLength(start);

    if (+start === 0) {
    
        fixedStart = 0;
    }

    const fixedEnd = fileSize % 16 === 0 ? fileSize : fixEndChunkLength(fileSize); //end % 16 === 0 ? end + 15: (fixEndChunkLength(end) - 1) + 16;
    
    const differenceStart = start - fixedStart;

    if (fixedStart !== 0 && start !== 0) {
    
        currentIV = await getPrevIVS3(fixedStart - 16, currentFile.metadata.s3ID) ;
    }

    const params = {Bucket: env.s3Bucket, Key: currentFile.metadata.s3ID, Range: `bytes=${fixedStart}-${fixedEnd}`};

    const s3ReadStream = s3.getObject(params).createReadStream();

    const CIPHER_KEY = crypto.createHash('sha256').update(password).digest()        

    const decipher = crypto.createDecipheriv('aes256', CIPHER_KEY, currentIV);

    res.writeHead(206, head);

    const allStreamsToErrorCatch = [s3ReadStream, decipher];

    s3ReadStream.pipe(decipher);

    const tempUUID = req.params.uuid;

    // s3ReadStream.on("data", () => {
    //     console.log("data", tempUUID);
    // })

    
    // req.on("close", () => {
    //     // console.log("Destoying read stream");
    //     // s3ReadStream.destroy();
    //     // console.log("Read Stream Destroyed");
    // })

    // req.on("end", () => {
    //     console.log("ending stream");
    //     s3ReadStream.destroy();
    //     console.log("ended stream")
    // })

    // req.on("error", () => {
    //     console.log("req error");
    // })

    // req.on("pause", () => {
    //     console.log("req pause")
    // })

    // req.on("close", () => {
    //     // console.log("req closed");
    //     s3ReadStream.destroy();
    // })

    //req.on("")

    // req.on("end", () => {
    //     console.log("req end");
    // })

    await awaitStreamVideo(start, end, differenceStart, decipher, res, req, tempUUID, allStreamsToErrorCatch);
    console.log("Video stream finished");
    s3ReadStream.destroy();
}