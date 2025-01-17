const MediaModel = require("../models/Media")
const { UploadMediatoCloudinary } = require("../utils/cloudinary")
const logger = require("../utils/logger")

const UploadMedia = async (req,res)=>{
    try{
        logger.info("starting media upload")
        if(!req.file){

            logger.error("no file provided")
            return res.status(500).json({
                message : "no file provided"
            })

        }
        const {originalname,buffer,mimetype} = req.file
        const userId = req.user.userId

        logger.info(`File Details ${originalname} and ${mimetype}`)
        logger.info('uploading to cloudinary')
       const uploadResult = await UploadMediatoCloudinary(req.file)
       logger.info(`upload to cloudinary succesful , public id : ${uploadResult.public_id}`)

       const newMedia = new MediaModel({
        publicId  : uploadResult.public_id,
        originalName : originalname,
        mimeType : mimetype,
        url : uploadResult.secure_url,
        userId

       })

       await newMedia.save()

       res.status(200).json({
        message: "uploaded succesfully",
        mediaId : newMedia._id,
        url : newMedia.url
       })

    }
    catch(e){
        res.status(500).json({
            message :"internal server error",
            error : e.message
        })

    }
}
const getAllMedia = async(req,res)=>{
    try{
        const mediadata = await MediaModel.find({})
        res.json({mediadata})


    }
    catch(e){
        res.status(500).json({
            message :"error fetching media",
            error : e.message
        })

    }
}
module.exports =  {UploadMedia,getAllMedia}