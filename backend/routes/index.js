const express = require('express');
const router = express.Router();
const userRouter = require('./user')
const promptRouter = require('./prompt')

const adminRouter = require('./admin');
const { Challenge } = require('../db');

router.use("/user", userRouter);
router.use("/prompts", promptRouter);
router.use("/admin", adminRouter);

// Public route to get all daily challenges
router.get("/challenges/daily", async (req, res) => {
    try {
        const challenges = await Challenge.find().sort({ createdAt: -1 });
        res.json({ challenges });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
