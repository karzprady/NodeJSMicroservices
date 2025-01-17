const PostModel = require('../models/Post')
const logger = require('../utils/logger')
const { publishEvent } = require('../utils/rabbitmq')
const { PostBodyValidation } = require('../utils/validation')


async function invalidateCache(req,input){

    const cachekey = `post:${input}`
    await req.redisClient.del(cachekey)

    const keys = await req.redisClient.keys(`posts:*`)
    if(keys.length>0){
        await req.redisClient.del(keys)
    }
}

const CreatePost = async (req,res)=>{
    try{
        logger.info("creating post")

        const {content,mediaIds} = req.body
        const {error} = PostBodyValidation(req.body)
        if(error){
            logger.info("invalid details provided",error.details[0].message)
            return res.status(404).json({
                success : "failed",
                message : error.details[0].message
            })
        }

        const newPost = new PostModel({
            user : req.user.userId,
            content,
            mediaIds : mediaIds || []
        }
        )

        await newPost.save()

        await publishEvent('post.created',{
            postId : newPost._id.toString(),
            userId : newPost.user.toString(),
            content : newPost.content,
            createdAt : newPost.createdAt

        })


        logger.info('Post created succesfully')
        await invalidateCache(req, newPost._id.toString())
        res.status(201).json({
            success : true,
            message : "post created succesully"
        })

    }
    catch(e){
        logger.error("error creating post")
        res.status(500).json({
            error : e.message
        })
    }
}

const getAllposts = async (req,res)=>{
    try{
        logger.info("getting all posts")
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10
        const skip= (page-1)*limit 

        const cachekey = `posts:${page}:${limit}`
        const cachedposts= await req.redisClient.get(cachekey)

        if(cachedposts){
            return res.json(JSON.parse(cachedposts))
        }
        const posts = await PostModel.find().sort({createdAt :  -1}).skip(skip).limit(limit)
        const totalDocs = await PostModel.countDocuments()
        const result = {
            currentpage : page,
            totalposts : posts,
            totalpages : Math.ceil(totalDocs/limit)
        }

        await req.redisClient.setex(cachekey,300,JSON.stringify(result))

        res.status(201).json(result)


    }
    catch(e){
        logger.error("error getting all post")
        res.status(500).json({
            error : e.message
        })
    }
}

const getSinglepost = async (req,res)=>{
    try{
        logger.info("getting single post")
        const postId = req.params.id 
        const cachekey = `posts:${postId}`
        const cachedSinglePost = await req.redisClient.get(cachekey)
        if(cachedSinglePost){
            return res.json(JSON.parse(cachedSinglePost))
        }

        const getSinglepost = await PostModel.findById(postId)
        if(!getSinglepost){
            return res.status(404).json({
                error : "post not found"
            })

        }
        const result = {
            content : getSinglepost.content,
            mediaIds : getSinglepost.mediaIds,
            user : req.user
        }
        await req.redisClient.setex(cachekey,300,JSON.stringify(result))
        res.json(result)


    }
    catch(e){
        logger.error("error getting single post")
        res.status(500).json({
            error : e.message
        })
    }
}


const deletePost = async (req,res)=>{
    try{
        logger.info("deleting post")
        const postid = req.params.id 
        const deletepost = await PostModel.findByIdAndDelete(postid)
        if(!deletepost){
            return res.status(404).json({
                error : "post not found"
            })
        }

        //publish post delete method
        
         await publishEvent('post.deleted',{
          postId : deletepost._id.toString(),
          userId : req.user.userId,
          mediaIds : deletepost.mediaIds
         })
         
        await invalidateCache(req,deletepost._id.toString())
        res.status(201).json({
            message : "deleted post"
        })


    }
    catch(e){
        logger.error("error deleting  post")
        res.status(500).json({
            error : e.message
        })
    }
}

module.exports = {CreatePost,getAllposts,getSinglepost,deletePost}