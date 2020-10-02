const mongoose = require('mongoose');

const fileSchema = mongoose.Schema({
    uploadDate: {
        type: Date,
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    s3ID: {
        type: String,
        required: true
    },
    metadata:{
        type:{
            createdBy:{
                type: String,
                //required: true
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


        },
        required:true
    }
})

const File = mongoose.model("File",fileSchema)

module.exports = File;