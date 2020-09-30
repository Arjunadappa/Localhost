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
    }
})

const File = mongoose.model("File",fileSchema)

module.exports = File;