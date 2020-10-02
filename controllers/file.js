const { S3 } = require("aws-sdk");
const S3Service = require("../service/S3Service");


exports.upload = async(req,res) => {
    try{
        const busboy = req.busboy;
        req.pipe(busboy);
        //const {file, filename, formData} = await BusboyData.data(req);
        const file = await S3Service.uploadFile( busboy, req);
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
