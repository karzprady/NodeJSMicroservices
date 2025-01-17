const express = require('express')
const { UserRegistration, UserLogin, RefreshTokenUser, logout } = require("../controllers/identity-controller")
const router = express.Router()

router.post('/register',UserRegistration)
router.post('/login',UserLogin)
router.post('/refreshtoken',RefreshTokenUser)
router.post('/logout',logout)
module.exports = router