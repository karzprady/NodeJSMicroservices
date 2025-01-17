//user registration

const RefreshModel = require('../models/RefreshToken')
const User = require('../models/User')
const generateToken = require('../utils/generateToken')
const logger = require('../utils/logger')
const { loginvalidation, registervalidation } = require('../utils/validation')
const UserRegistration = async (req,res)=>{
    try{
        logger.info('Triggering User Registration')
        // validate schema

        const {error} = registervalidation(req.body)
        
        
        if(error){
            logger.warn("validation error",error.details[0].message)
            return res.status(403).json({
                success : "failed",
                message : error.details[0].message
            })
        }
        const {username,email,password}=req.body
        let user = await User.findOne({$or : [{email},{username}]})
        if(user){
            logger.warn("user already exists")
            return res.status(403).json({
                success : "failed",
                message : "user already exists"
            })
        }
        user = new User({username,email,password})
        await user.save()
        logger.warn("user created",user._id)
        const {accessToken,RefreshToken} = await generateToken(user)
        res.status(201).json({
            success : true,
            message  : "user registered succesfully",
            accessToken,
            RefreshToken
        })

    }
    catch(e){
        logger.error("some error occured")

        res.status(500).json({
            success : "failed",
            message : "something went wrong while registering "
        })

    }
}

const UserLogin = async(req,res)=>{
    try{
       const {error} = loginvalidation(req.body)
       if(error) {
        logger.warn("validation error",error.details[0].message)
            return res.status(403).json({
                success : "failed",
                message : error.details[0].message
            })

       }
       logger.info("req body ok")

       const {email,password} = req.body
       const user = await User.findOne({email})
       if(!user){
        logger.warn("user doesnt exist")
            return res.status(403).json({
                success : "failed",
                message : "user doesnt exist"
            })

       }
       logger.info("user exists ok")
       const verify = await user.comparePassword(password)
       if(!verify){
        logger.warn("invalid password")
            return res.status(403).json({
                success : "failed",
                message : "invalid password"
            })

       }
       logger.info("user password ok")

       const {accessToken,RefreshToken} = await generateToken(user)
       res.status(201).json({
        accessToken,
        RefreshToken,
        userId : user._id
       })

    }
    catch(e){
        logger.error("some error occured")

        res.status(500).json({
            success :  e.message
        })
    }
}

const RefreshTokenUser = async(req,res)=>{
    try{
        const {providedtoken} = req.body
        if(!providedtoken) {
            logger.warn("Token not provided")
            return res.status(403).json({
                success : "failed",
                message : "Token not provided"
            })}
        const StoredToken = await RefreshModel.findOne({token : providedtoken})
        if(!StoredToken){
            logger.warn("invalid token")
            return res.status(403).json({
                success : "failed",
                message : "invalid token"
            })

        }
        const user = await User.findOne({user:StoredToken.user})
        if(!user){
            logger.warn("user not found")
            return res.status(403).json({
                success : "failed",
                message : "user not found"
            })

        }
        //new acess token
      
        const {accessToken : newAccess,RefreshToken : newRefresh} = await generateToken(user)

        //delete old accesstoken
        await RefreshModel.deleteOne({_id : StoredToken._id})
        res.status(201).json({
            accessToken :  newAccess,
            RefreshToken : newRefresh,
            
        })



    }
    catch(e){
        logger.error("some error occured while hitting refreshtoken")

        res.status(500).json({
            message :  e.message
        })

    }
}

const logout = async(req,res)=>{
    try{
        const {providedtoken} = req.body
        if(!providedtoken) {
            logger.warn("Token not provided")
            return res.status(403).json({
                success : "failed",
                message : "Token not provided"
            })}

        await RefreshModel.deleteOne({token : providedtoken})
        logger.info("refresh token deleted")
         res.status(201).json({
            success : "true",
            message : "loggedout succefully"
        })}


    
    catch(e){
        logger.error("some error occured while logout")

        res.status(500).json({
            message :  e.message
        })

    }
}

module.exports = {UserRegistration,UserLogin,RefreshTokenUser,logout}