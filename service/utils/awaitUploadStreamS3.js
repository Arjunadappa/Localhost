const s3 = require("../../databases/S3.js");
const awaitUploadStreamS3 = (params) => {

    return new Promise((resolve, reject) => {

        s3.upload(params, (err, data) => {

            if (err) {
                reject("Amazon upload error");
            }

            resolve();
        })

    })
}

module.exports = awaitUploadStreamS3;