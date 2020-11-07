const mongoose = require('mongoose');

const thumbnailSchema = new mongoose.Schema({
    
    name: {
        type: String, 
        required: true,
    },
    createdBy: {
        type: String, 
        required: true
    },
    
    data: {
        type: Buffer,
    },
    path: {
        type: String
    },

    IV: {
        type: Buffer,
    },
    s3ID: String
}, {
    timestamps: true
})

const Thumbnail = mongoose.model("Thumbnail", thumbnailSchema);

module.exports = Thumbnail