const s3 = require("../../databases/S3");
const crypto = require("crypto");
const sharp = require("sharp");
const uuid = require("uuid");
const File = require("../../models/file");
const Thumbnail = require('../../models/thumbnail');

const createThumbnailS3 = (file, filename, user) => {

    return new Promise((resolve, reject) => {

        const password = user.getEncryptionKey();
        if(!password){
            throw new Error('keys not found')
        }
        let CIPHER_KEY = crypto.createHash('sha256').update(password).digest()       
        
        const thumbnailFilename = uuid.v4();
    
        const params = {Bucket: process.env.s3Bucket, Key: file.metadata.s3ID};

        const readStream = s3.getObject(params).createReadStream();

        const decipher = crypto.createDecipheriv('aes256', CIPHER_KEY, file.metadata.IV);

        readStream.on("error", (e) => {
            console.log("File service upload thumbnail error", e);
            resolve(file);
        })
    
        decipher.on("error", (e) => {
            console.log("File service upload thumbnail decipher error", e);
            resolve(file)
        })

        try {
            
            const thumbnailIV = crypto.randomBytes(16); 
            const thumbnailCipher = crypto.createCipheriv("aes256", CIPHER_KEY, thumbnailIV);

            const imageResize = sharp().resize(300).on("error", (e) => {
                
                console.log("resize error", e);
                resolve(file);
            })

            const paramsWrite = {
                Bucket: process.env.s3Bucket,
                Body : readStream.pipe(decipher).pipe(imageResize).pipe(thumbnailCipher),
                Key : thumbnailFilename
            };

            s3.upload(paramsWrite, async(err, data) => {

                if (err) {
                    console.log("Amazon Upload Error", err);
                    reject("Amazon upload error");
                }

                const thumbnailModel = new Thumbnail({name: thumbnailFilename, createdBy: user._id, IV: thumbnailIV, s3ID: thumbnailFilename});

                await thumbnailModel.save();
                const getUpdatedFile = await File.findOneAndUpdate({"_id": file._id}, {"$set": {"metadata.hasThumbnail": true, "metadata.thumbnailID": thumbnailModel._id}},{new:true})
                
    
                resolve(getUpdatedFile);
            })

         } catch (e) {

            console.log("Thumbnail error", e);
            resolve(file);
         }
    })
}

module.exports = createThumbnailS3