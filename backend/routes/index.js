const express = require('express');
const router = express.Router();
const userRouter = require('./user');
const promptRouter = require('./prompt');
const adminRouter = require('./admin');
const { Challenge, User } = require('../db');
const { authMiddleware } = require('../middleware');
const { addXp } = require('../gamification');
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.use("/user", userRouter);
router.use("/prompts", promptRouter);
router.use("/admin", adminRouter);

// Public route to get all daily challenges
router.get("/challenges/daily", async (req, res) => {
    try {
        const challenges = await Challenge.find({ type: 'daily' }).sort({ createdAt: -1 });
        res.json({ challenges });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Public route to get all weekly challenges
router.get("/challenges/weekly", async (req, res) => {
    try {
        const challenges = await Challenge.find({ type: 'weekly' }).sort({ createdAt: -1 });
        res.json({ challenges });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Submit a prompt for a challenge
router.post("/challenges/:id/submit", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { prompt } = req.body;

        if (!prompt || !prompt.trim()) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        const challenge = await Challenge.findById(id);
        if (!challenge) return res.status(404).json({ error: "Challenge not found" });

        // Gemini AI Evaluator
        let score = 0;
        let feedback = "";

        try {
            const systemInstruction = process.env.WEEKLY_CHALLENGE_SYSTEM_PROMPT || `You are an AI. Return ONLY a raw JSON object with EXACTLY two properties: "score" (1) and "feedback" ("Dumbass check.env").`;

            const userContent = `Target Goal: ${challenge.description}\nUser Prompt: ${prompt}`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: userContent,
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: "application/json"
                }
            });

            const aiResult = JSON.parse(response.text);
            score = aiResult.score || Math.floor(Math.random() * 50) + 20; // fallback score
            feedback = aiResult.feedback || "Gemini is dumb";

        } catch (apiError) {
            console.error("Gemini API Error:", apiError);
            // Fallback mock logic if API fails
            const charCount = prompt.length;
            score = charCount < 50 ? 90 : 60;
            feedback = "API Evaluation failed. Fallback score applied based on length.";
        }

        // Award XP if score is decent
        let xpAwarded = 0;
        let leveledUp = false;
        let newLevel = null;

        if (score >= 70) {
            xpAwarded = Math.floor((challenge.rewardXp || 100) * (score / 100)); // partial XP based on score
            const user = await User.findById(req.userId);
            if (user) {
                const xpResult = await addXp(user, xpAwarded);
                leveledUp = xpResult.leveledUp;
                newLevel = xpResult.level;
                await user.save();
            }
        }

        res.json({
            score,
            feedback,
            xpAwarded,
            leveledUp,
            newLevel,
            message: "Challenge evaluated"
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to submit challenge" });
    }
});

module.exports = router;
