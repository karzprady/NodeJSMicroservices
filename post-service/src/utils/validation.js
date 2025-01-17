const Joi = require("joi")


const PostBodyValidation = (data) =>{
    const Schema = Joi.object({
        content : Joi.string().required(),
        mediaIds : Joi.array()
         
       
    })
    

    return Schema.validate(data)
}

module.exports = {PostBodyValidation}