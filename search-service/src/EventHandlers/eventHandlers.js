const searchModel = require("../models/Search")
const logger = require("../utils/logger")
const redisClient = require("../redisclient/redis")
async function invalidateCache(){
    const keys = await redisClient.keys(`search:*`)
    if(keys.length>0){
        await redisClient.del(keys)
    }
}

const SearchEvent = async(event)=>{
    try{
        const search = new searchModel({
            postId : event.postId,
            userId : event.userId,
            content : event.content,
            createdAt : event.createdAt
        })
        
        await search.save()
        await invalidateCache()
       
        
        logger.info(`search post created succesfully : ${event.postId},${search._id.toString()}`)

    }
    catch(e){
        logger.error("error in search creation event",e) 

    }
}

const searchDeleteEvent = async (event)=>{
    try{
        const {postId} = event

        const deletesearch = await searchModel.findOneAndDelete({postId})
        await invalidateCache()
        logger.info(`search deleted  succesfully : ${event.postId},${deletesearch._id.toString()}`)



    }
    catch(e){
        logger.error("error in search deletion event",e) 

    }
}

module.exports = {SearchEvent,searchDeleteEvent}