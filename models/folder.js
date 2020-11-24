const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
    folderName:{
        type: String,
        required: true
    },
    parentDirectory:{
        type: String,
        required: true
    },
    directoryHierarachy:{
        type: Array,
        required: true
    },
    createdBy:{
        type: String,
        required: true
    }
},{
    timestamps:true
});

const Folder = mongoose.model("Folder",folderSchema);

module.exports = Folder;