const s3 = require("../../databases/S3.js");
const deleteChunkS3 = (params) => {
    return new Promise((resolve, reject) => {
        s3.deleteObject(params, (err, data) => {

            if (err) {
                console.log(err)
                reject("Could Not Remove S3 File");
            }

            console.log("Deleted S3 file");
            resolve();
        })
    })
}
module.exports = deleteChunkS3;