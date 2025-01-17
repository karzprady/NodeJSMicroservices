const mongoose = require("mongoose")

const PostSchema = new mongoose.Schema({
    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Users",
        required : true
    },
    content : {
        type : String,
        required : true,

    },
    mediaIds : [{
        type : String
    }],
    createdAt : {
        type : Date,
        default : Date.now()
    }
},{timestamps : true})

// PostSchema.index({content : "text"})

const PostModel = mongoose.model("Posts",PostSchema)

module.exports = PostModel