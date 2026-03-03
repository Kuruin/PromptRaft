const express = require('express');
const router = express.Router();
const userRouter = require('./user')
const promptRouter = require('./prompt')

router.use("/user", userRouter);
router.use("/prompts", promptRouter);

module.exports = router;
