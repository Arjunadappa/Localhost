const File = require("../models/file");
const BusboyData = require("../utils/BusboyData");
const awaitUploadStreamS3 = require("./utils/awaitUploadStreamS3.js")
const uuid  = require("uuid");
exports.uploadFile = async(busboy,req) => {
    const {file, filename, formData} = await BusboyData.data(busboy);
    console.log(formData);
    const randomS3ID = uuid.v4();
    const parentDirectory = formData.get('parentDirectory') ? formData.get('parentDirectory') : '/';
    const directoryHierarachy = formData.get('directoryHierarachy') ? formData.get('directoryHierarachy') : '/';
    const fileSize = formData.get('fileSize') ? formData.get('fileSize') : '';

    const params = {
        Bucket: process.env.s3Bucket,
        Body : file,
        Key : randomS3ID
    };
    const metadata = {
        parentDirectory,
        directoryHierarachy,
        fileSize
    }
    await awaitUploadStreamS3(params);
    const date = new Date();
    const fileTobeUploaded = new File({
        filename,
        s3ID:randomS3ID,
        uploadDate:date.toISOString(),
        metadata
    })
    await fileTobeUploaded.save()
    return fileTobeUploaded;

    // await awaitUploadStreamS3(params);
    // return file;
    

}