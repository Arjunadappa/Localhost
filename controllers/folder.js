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