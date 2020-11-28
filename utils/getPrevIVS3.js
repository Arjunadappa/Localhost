const s3 = require("../databases/S3")


const getPrevIV = (start, key) => {

    return new Promise((resolve, reject) => {

        const params = {Bucket: process.env.s3Bucket, Key: key, Range: `bytes=${start}-${start + 15}`};

        const stream = s3.getObject(params).createReadStream();

        stream.on("data", (data) => {

            resolve(data);
        })
    })
}

module.exports = getPrevIV