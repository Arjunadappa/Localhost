const { S3 } = require("aws-sdk");
const S3Service = require("../service/S3Service");
const File = require("../models/file");
const jwt = require("jsonwebtoken");
const sortBySwitch = require("../utils/sortBySwitch");
const createQuery = require("../utils/createQuery")

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
        const file = await File.findOneAndUpdate({"_id":fileId,"metadata.owner":userId},{"$set": {"filename": title}},{new:true});
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
        const file = await File.findOne({"_id":fileId,"metadata.owner":userId});
        if(!file){
            throw new Error("file could not be found");
        }
        res.send(file)
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
        const fileID = req.params.id;
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
        const file = await File.findOneAndUpdate({"_id": fileID,"metadata.owner": userID},{"$set": {"metadata.linkType": "public", "metadata.link": token}},{new:true});
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
        const file = await File.findOneAndUpdate({"_id": fileID, "metadata.owner": userID}, {"$unset": {"metadata.linkType": "", "metadata.link": ""}});
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
        const file = await File.findOneAndUpdate({"_id": fileID,"metadata.owner": userID},{"$set": {"metadata.linkType": "one", "metadata.link": token}},{new:true});
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
        const fileList = await File.find(queryObj).sort(sortBy).limit(limit);
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
        const quickList = await File.find({"metadata.owner": userID})
        .sort({uploadDate: -1})
        .limit(10)
        
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
