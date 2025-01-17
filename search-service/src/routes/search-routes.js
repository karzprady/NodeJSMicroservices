const express = require('express')
const authenticateReq = require('../middleware/authmiddleware')
const SearchPostController = require('../controller/search-controller')

const router = express.Router()

router.use(authenticateReq)

router.get("/posts",SearchPostController)

module.exports = router