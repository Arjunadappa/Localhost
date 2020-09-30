const AWS = require("aws-sdk")

AWS.config.update({
    accessKeyId: process.env.s3ID,
    secretAccessKey: process.env.s3Key
})

const s3 = new AWS.S3();
module.exports = s3;