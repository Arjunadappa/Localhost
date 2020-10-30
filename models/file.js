const mongoose = require('mongoose');

const fileSchema = mongoose.Schema({
    length: {
        type: Number,
        required: true,
    },
    chunkSize: {
        type: Number, 
    },
    uploadDate: {
        type: Date,
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    metadata:{
        type:{
            createdBy:{
                type: String,
                required: true
            },
            parentDirectory:{
                type:String,
                required: true
            },
            directoryHierarachy:{
                type: String,
                required: true
            },
            fileSize:{
                type:String,
                required: true
            },
            hasThumbnail: {
                type: Boolean,
                required: true
            },
            isVideo: {
                type: Boolean,
                required: true
            },
            thumbnailID: String,
            size: {
                type: Number,
                required: true,
            },
            IV: {
                type: Buffer,
                required: true
            },
            s3ID: {
                type: String,
                required: true
            },
            linkType: String,
            link: String,
            filePath: String


        },
        required:true
    }
})

const File = mongoose.model("File",fileSchema)

module.exports = File;