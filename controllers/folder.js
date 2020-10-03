const S3Service = require("../service/S3Service");
const Folder = require("../models/folder");


exports.uploadFolder = async(req,res) => {
    try {
        const folder = new Folder(req.body);
        await folder.save();
        if(!folder) throw "folder not uploded";
        res.send(folder);
    } catch (e) {
        const code = e.code
        console.log(e.message, e.exception)
        return res.status(code).send();
    }

}