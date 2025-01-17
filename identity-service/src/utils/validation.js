const Joi = require("joi")
const { emit } = require("../models/RefreshToken")
const logger = require("./logger")

const registervalidation = (data) =>{
    const Schema = Joi.object({
        username : Joi.string().min(3).max(50).required(),
        email : Joi.string().email().required(),
        password : Joi.string().min(3).max(50).required()
    })
    

    return Schema.validate(data)
}
const loginvalidation = (data)=>{
    const schema = Joi.object({
        email : Joi.string().email().required(),
        password : Joi.string().required()
    })
    return schema.validate(data)
}

module.exports = {registervalidation,loginvalidation}