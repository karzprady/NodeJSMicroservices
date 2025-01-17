const MediaModel = require("../models/Media")
const { deleteFromCloudinary } = require("../utils/cloudinary")
const logger = require("../utils/logger")

const HandlePostdeleted = async(event)=>{
console.log("event ::: ", event)

const {postId,mediaIds} = event
try{
const mediaDelete = await MediaModel.find({_id : {$in : mediaIds}})
console.log("mediaDelete",mediaDelete)
for(const media of mediaDelete){
    
    await deleteFromCloudinary(media.publicId)
    await MediaModel.findByIdAndDelete(media._id)
    logger.info(`deleted media ${media._id} associated with post ${postId}`)
}   
logger.info(`processed deletion of media for postid : ${postId}`)
}
catch(e){
    logger.error("error occured while deleteing media of posts")

}
}

module.exports = HandlePostdeleted