const jwt = require('jsonwebtoken')
const crypto = require("crypto")
const RefreshModel = require('../models/RefreshToken')
require('dotenv').config()
const generateToken = async (user)=>{

    const accessToken = jwt.sign({
        userId : user._id,
        username : user.username},
        process.env.JWT_SECRET,{
        expiresIn : "60m"
    })

    const RefreshToken = crypto.randomBytes(40).toString("hex")
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate()+7) //7days

    await RefreshModel.create({
        token : RefreshToken,
        user: user._id,
        expiresAt
    })

    return {accessToken,RefreshToken}

}

module.exports = generateToken