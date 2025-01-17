const express = require('express')
const authenticateReq = require('../middleware/authmiddleware')
const { CreatePost, getAllposts, getSinglepost, deletePost } = require('../controller/post-controller')

const router = express()

router.use(authenticateReq)

router.post("/createPost",CreatePost)
router.get("/getAllPosts",getAllposts)
router.get("/getSinglePost/:id",getSinglepost)
router.delete("/deletePost/:id",deletePost)

module.exports = router