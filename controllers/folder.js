const S3Service = require("../service/S3Service");
const Folder = require("../models/folder");


exports.uploadFolder = async(req,res) => {
    if(!req.user){
        return;
    }
    try {
        const data = {...req.body,createdBy:req.user._id};
        const folder = new Folder(data);
        await folder.save();
        if(!folder) throw "folder not uploded";
        res.send(folder);
    } catch (e) {
        const code = e.code
        console.log(e.message, e.exception)
        return res.status(code).send();
    }

}

exports.deleteFolder = async (req,res) => {
    if(!req.user){
        return;
    }
    try {
        const userID = req.user._id;
        const folderID = req.body.id;
        const directoryHierarachy = req.body.directoryHierarachy;
        await S3Service.deleteFolder(userID,folderID,directoryHierarachy);
        res.send()
    } catch (e) {
        const code = e.code
        console.log(e.message, e.exception)
        return res.status(code).send();
    }
}

exports.deleteAll = async (req,res) => {
    if(!req.user){
        return;
    }
    try {
        const userID = req.user._id;
        await S3Service.deleteAll(userID);
        res.send();

    } catch (e) {
        const code = e.code
        console.log(e.message, e.exception)
        return res.status(code).send();
    }
}

exports.rename = async (req,res) => {
    if(!req.user){
        return;
    }
    try {
        const userID = req.user._id;
        const folderID = req.body.id;
        const updatedName = req.body.newname;

        const folder = await Folder.findOneAndUpdate({"createdBy":userID,"_id":folderID},{"$set":{"folderName":updatedName}},{new:true})
        res.send(folder)
    } catch (e) {
        const code = e.code
        console.log(e.message, e.exception)
        return res.status(code).send();
    }
    
}