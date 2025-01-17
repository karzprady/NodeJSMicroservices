const mongoose = require('mongoose')

const MediaSchema = new mongoose.Schema({
    publicId : {
        type : String,
        required : true
    },
    originalName : {
        type : String,
        required : true
    },
    mimeType :{
        type : String,
        required : true
    },
    url:{
        type : String,
        required : true

    },
    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Users"
    }
},{timestamps : true})

const MediaModel = mongoose.model("Media",MediaSchema)

module.exports = MediaModel