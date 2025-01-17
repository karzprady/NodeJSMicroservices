const mongoose = require('mongoose')
const argon = require("argon2")

const UserSchema= new mongoose.Schema({
    username : {
        type : String,
        unique : true,
        trim : true,
        required : true
    },
    email :{
        type : String,
        unique : true,
        trim : true,
        required : true,
        lowercase : true

    },
    password:{
        type : String,
        required : true
    },
    createdAt : {
        type : Date,
        default : Date.now()
    }
},
{timestamps : true})

UserSchema.pre('save',async function (next) {
    try{
    if(this.isModified('password')){
        this.password = await argon.hash(this.password)


    }
}
catch(e){
    return next(e)
}
})

UserSchema.methods.comparePassword = async function (candidate) 
    {
    try{
        return await argon.verify(this.password,candidate) 

    }
    catch(e){
        throw e
    }
}

UserSchema.index({username : "text"})

const User = mongoose.model("Users",UserSchema)
module.exports = User