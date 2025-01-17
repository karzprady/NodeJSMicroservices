const mongoose = require('mongoose')

const RefreshTokenSchema = new mongoose.Schema({
    token : {
        type : String,
        required : true,
        unique : true
    },

    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Users",
        required : true
    },
    expiresAt : {
        type : Date,
        required : true,
    }
},{timestamps : true})

RefreshTokenSchema.index({expiresAt:1},{expireAfterSeconds:0})


const RefreshModel = mongoose.model("RefreshToken",RefreshTokenSchema)
module.exports  = RefreshModel