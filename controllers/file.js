const { S3 } = require("aws-sdk");
const S3Service = require("../service/S3Service");
const File = require("../models/file");

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
    try{
        const fileId = req.body.id;
        const title  = req.body.title;
        console.log(fileId);
        const file = await File.findOneAndUpdate({"_id":fileId},{"$set": {"filename": title}},{new:true})
        res.send(file);
    }
    catch (e) {
    
        const code = e.code || 500;

        console.log(e);
        res.status(code).send()
    }
}

exports.getFileInfo = async(req,res) => {
    try{
        const fileId = req.params.id;
        console.log(fileId);
        const file = await File.findOne({"_id":fileId});
        res.send(file)
    }catch (e) {
        const code = e.code
        console.log(e.message, e.exception)
        return res.status(code).send();
    }
}

exports.deleteFile = async(req,res) => {
    try {
        const fileId = req.body.id;
        console.log(fileId);
        await S3Service.deleteFile(fileId);
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
