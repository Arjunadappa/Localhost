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
