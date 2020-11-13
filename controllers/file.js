const { S3 } = require("aws-sdk");
const S3Service = require("../service/S3Service");
const File = require("../models/file");
const Folder = require("../models/folder");
const jwt = require("jsonwebtoken");
const sortBySwitch = require("../utils/sortBySwitch");
const createQuery = require("../utils/createQuery");
const mongoose = require("../databases/mongoose");
const conn = mongoose.connection;

exports.upload = async(req,res) => {
    if(!req.user){
        return;
    }
    try{
        const busboy = req.busboy;
        const user = req.user;
        console.log(user)
        req.pipe(busboy);
        //const {file, filename, formData} = await BusboyData.data(req);
        const file = await S3Service.uploadFile(user, busboy, req);
        //handle error here
        //if(!file)......

        res.status(200).json({
            status:'sucess',
            data:{
                data:file
            }
        })
        //res.send(req.busboy);
        //const file = S3Service.uploadFile(req)
        
    }catch(e){
        const code = e.code
        console.log(e.message, e.exception)
        return res.status(code).send();

    }

}

exports.renameFile = async(req,res) => {
    if (!req.user) {
        return;
    }
    try{
        const fileId = req.body.id;
        const title  = req.body.title;
        const userId = req.user._id;
        console.log(fileId);
        const file = await File.findOneAndUpdate({"_id":fileId,"metadata.createdBy":userId},{"$set": {"filename": title}},{new:true});
        if(!file){
            throw new Error("file to be renamed not found");
        }
        res.send(file);
    }
    catch (e) {
    
        const code = e.code || 500;

        console.log(e);
        res.status(code).send()
    }
}

exports.getFileInfo = async(req,res) => {
    if(!req.user){
        return;
    }
    try{
        const fileId = req.params.id;
        const userId = req.user._id;
        console.log(fileId);
        const currentFile = await File.findOne({"_id":fileId,"metadata.createdBy":userId});
        if(!currentFile){
            throw new Error("file could not be found");
        }
        const parentID = currentFile.metadata.parentDirectory;
        let parentName = ""; 
        if (parentID === "/") {
    
            parentName = "Home"
    
        } else {
    
            const parentFolder = await Folder.findOne({"createdBy": userID, "_id": parentID});
                
            if (parentFolder) {
    
                parentName = parentFolder.name;
    
            } else {
    
                parentName = "Unknown"
            }
    
        }
    
        res.send({currentFile,parentName})
    }catch (e) {
        const code = e.code
        console.log(e.message, e.exception)
        return res.status(code).send();
    }
}

exports.deleteFile = async(req,res) => {
    if(!req.user){
        return;
    }
    try {
        const userId = req.user._id;
        const fileId = req.body.id;
        console.log(fileId);
        await S3Service.deleteFile(userId,fileId);
        res.status(200).json({
            status:'sucess',
            outcome: 'deleted Succesfully'
        })

    } catch (e) {
        const code = e.code
        console.log(e.message, e.exception)
        return res.status(code).send();
    }
}

exports.getThumbnail = async (req,res) => {
    if(!req.user){
        return;
    }
    try{
        const user = req.user;
        const id = req.params.id;
        const decryptedThumbnail = await S3Service.getThumbnail(user, id);
        res.send(decryptedThumbnail);

    }catch (e) {
        const code = e.code || 500;
        console.log(e);
        res.status(code).send();
    }
}
// exports.getFullThumbnail = async (req,res) => {
//     if(!req.user){
//         console.log('hello')
//         return;
//     }
//     try {
//         const user = req.user;
//         const fileID = req.params.id;
//         console.log(fileId);
//         const fullThumbnail = await S3Service.getFullThumbnail(user, fileID, res);
//         res.send(fullThumbnail);
//     } catch (e) {
        
//     }
// }

exports.getDownloadToken = async (req,res) => {
    if(!req.user){
        return;
    }
    try {
        const user = req.user;
        console.log(user)
        const tempToken = await user.generateTempAuthToken();
        console.log(tempToken)
        if(!tempToken) throw new Error("token not generated");
        res.send({tempToken})
    } catch (e) {
        const code = e.code || 500;
        console.log(e);
        res.status(code).send();
    }
}
exports.downloadFile = async (req,res) => {
    if(!req.user){
        return;
    }
    try {
        const user = req.user;
        console.log(user)
        const fileID = req.params.id;
        console.log(fileID)
        await S3Service.downloadFile(user, fileID, res);
    } catch (e) {
        const code = e.code || 500;
        console.log(e);
        res.status(code).send();
    }
}

exports.makePublic = async (req,res) => {
    if(!req.user){
        return;
    }
    try {
        const fileID = req.params.id;
        const userID = req.user._id;
        const token = await jwt.sign({_id: userID.toString()}, process.env.password);
        const file = await File.findOneAndUpdate({"_id": fileID,"metadata.createdBy": userID},{"$set": {"metadata.linkType": "public", "metadata.link": token}},{new:true});
        console.log(file)
        if(!file){
            throw new Error("file not found")
        }
        res.send(token)
    } catch (e) {
        const code = e.code || 500;
        console.log(e);
        res.status(code).send();
    }
}

exports.getPublicInfo = async (req,res) => {
    try {
        const fileID = req.params.id;
        const tempToken = req.params.tempToken;
        const file = await File.findOne({"_id": fileID, "metadata.link": tempToken});
        if(!file){
            throw new Error("public file not found")
        }
        res.send(file)
    } catch (error) {
        const code = e.code || 500;
        console.log(e);
        res.status(code).send();
    }
    
}

exports.removeLink = async (req,res) => {
    if(!req.user){
        return;
    }
    try {
        const fileID = req.params.id;
        const userID = req.user._id;
        const file = await File.findOneAndUpdate({"_id": fileID, "metadata.createdBy": userID}, {"$unset": {"metadata.linkType": "", "metadata.link": ""}});
        console.log(file)
        if(!file){
            throw new Error("public file not found ");

        }
        res.send();
    } catch (e) {
        const code = e.code || 500;
        console.log(e);
        res.status(code).send();
    }
}

exports.makeOneTimePublic = async (req,res) => {
    if(!req.user){
        return;
    }
    try {
        const fileID = req.params.id;
        const userID = req.user._id;
        const token = await jwt.sign({_id: userID.toString()}, process.env.password);
        const file = await File.findOneAndUpdate({"_id": fileID,"metadata.createdBy": userID},{"$set": {"metadata.linkType": "one", "metadata.link": token}},{new:true});
        console.log(file)
        if(!file){
            throw new Error("file not found")
        }
        res.send(token)
        
    } catch (e) {
        const code = e.code || 500;
        console.log(e);
        res.status(code).send();
    }
}

exports.getList =  async (req,res) => {
    if (!req.user) {
        return
    }
    try {

        const query = req.query;
        const userID = req.user._id;
        let searchQuery = query.search || "";
        const parent = query.parent || "/";
        let limit = query.limit || 50;
        let sortBy = query.sortby || "DEFAULT"
        const startAt = query.startAt || undefined
        const startAtDate = query.startAtDate || "0"
        const startAtName = query.startAtName || "";
        sortBy = sortBySwitch(sortBy)
        limit = parseInt(limit);
        const queryObj = createQuery(userID, parent, query.sortby,startAt, startAtDate, searchQuery, startAtName);
        console.log(queryObj,sortBy,limit)
        const fileList = await conn.db.collection('files').find(queryObj).sort(sortBy).limit(limit).toArray();
        if(!fileList){
            throw new Error("files not found")
        }
        res.send(fileList);

    } catch (e) {
        
        const code = e.code || 500;
        console.log(e);
        res.status(code).send()
    }
}

exports.getQuickList = async (req,res) => {
    if(!req.user){
        return 
    }

    try {
        const userID = req.user._id;
        console.log(conn.db)
        const quickList = await conn.db.collection('files').find({"metadata.createdBy": userID})
        .sort({uploadDate: -1})
        .limit(10)
        .toArray()
        
        
        if(!quickList){
            throw new Error("no results found")
        }
        res.send(quickList)
    } catch (e) {
        const code = e.code || 500;
        console.log(e);
        res.status(code).send()
    }
}

exports.getPublicDownload = async (req,res) => {
    try {

        const ID = req.params.id;
        const tempToken = req.params.tempToken;

        await S3.getPublicDownload(ID, tempToken, res);

    } catch (e) {

        const code = e.code || 500;
        const message = e.message || e;

        console.log(message, e);
        res.status(code).send();
    } 
}

exports.getQuickList = async (req,res) => {
    if(!req.user){
        return;
    }
    try {
        const userID = req.user._id;
        const quickList = await conn.db.collection("files")
        .find({"metadata.createdBy": userID})
        .sort({uploadDate: -1})
        .limit(10)
        .toArray();
        if(!quickList) throw new Error("List not found ")
        res.send(quickList);
    } catch (e) {
        const code = e.code || 500;
        const message = e.message || e;
        console.log(message, e);
        res.status(code).send();
    }
}

exports.getSuggestedList = async (req,res) => {
    if(!req.user){
        return;
    }
    try {
        const userID = req.user._id;
        let searchQuery = req.query.search || "";
        searchQuery = new RegExp(searchQuery, 'i')
        const fileList = await conn.db.collection("files")
        .find({"metadata.createdBy": userID, "filename": searchQuery})
        .limit(10)
        .toArray();
        const folderList = await Folder.find({"owner": userID, "name": searchQuery}).limit(10);
        if (!fileList || !folderList) throw new Error("Suggested List Not Found Error");
        res.send({fileList,folderList})
    } catch (e) {
        const code = e.code || 500;
        const message = e.message || e;
        console.log(message, e);
        res.status(code).send();
    }
}
