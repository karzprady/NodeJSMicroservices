const searchModel = require("../models/Search")
const logger = require("../utils/logger")

const SearchPostController = async(req,res)=>{
    try{
        const {query}= req.query
        const cachekeys = `search:${query}`
        const cachedsearch = await req.redisClient.get(cachekeys)
        if(cachedsearch){
            return res.json(JSON.parse(cachedsearch))
        }
        const results = await searchModel.find({
            $text : {$search : query}
        },{
            score : {$meta : 'textScore'}
        }).sort({
            score : {$meta : 'textScore'}
        }).limit(10)

        await req.redisClient.setex(cachekeys,300,JSON.stringify(results))

        res.json({
            results
        })

    }
    catch(e){
        logger.error("error searching  post")
        res.status(500).json({
            error : e.message
        })
    }
}

module.exports= SearchPostController