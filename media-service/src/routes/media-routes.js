const express =require("express")
const multer = require('multer')

const {UploadMedia, getAllMedia} = require("../controller/media-controller")
const authenticateReq = require("../middleware/authmiddleware")
const logger = require("../utils/logger")

const router = express.Router()
//configure multer

const upload = multer({
    storage : multer.memoryStorage(),
    limits : {
        fileSize : 5 *1024 * 1024 * 1024,

    }
}).single('file')

router.post("/upload",authenticateReq,(req,res,next)=>{
    upload(req,res,(err)=>{
        if(err instanceof multer.MulterError){
            logger.error("MulterError while uploding",err)
            return res.status(400).json({
                message : "Multer error occured",
                error : err.message,
                stack : err.stack
            })
        }
        else if(err){
            logger.error("MulterError while uploding",err)
            return res.status(400).json({
                message : "Multer error occured",
                error : err.message,
                stack : err.stack
            })

        }
        if(!req.file){
            logger.error("no file found")
            return res.status(400).json({
                message : "no file found"
            })
        }
        next()
    })
},UploadMedia)

router.get("/getmedia",authenticateReq,getAllMedia)

module.exports = router