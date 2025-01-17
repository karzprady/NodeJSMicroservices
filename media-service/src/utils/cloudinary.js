const cloudinary = require('cloudinary').v2
const logger = require('../utils/logger')
require('dotenv').config()

cloudinary.config({
     cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
     api_key : process.env.CLOUDINARY_API_KEY  ,
     api_secret : process.env.CLOUDINARY_API_SECRET 
})

const UploadMediatoCloudinary =  (file) =>{
    return new Promise((res,rej)=>{
        const UploadtoStream = cloudinary.uploader.upload_stream({
            resource_type : "auto",
        },(err,info)=>{
            if(err){ logger.error("Error occured while uploading media",err)
                rej(err)

            }
            else{
            res(info)
            }
        })
        UploadtoStream.end(file.buffer)
    })
}

const deleteFromCloudinary = async (publicId)=>{
    try{
        const result= await cloudinary.uploader.destroy(publicId)
        logger.info("media deleted succesfully from cloud storage",publicId)
        return result


    }
    catch(e){
        logger.error("error deleting media from cloudinary",e)
    }
}

module.exports = {UploadMediatoCloudinary,deleteFromCloudinary}