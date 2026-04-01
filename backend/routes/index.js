const express = require('express');
const router = express.Router();
const userRouter = require('./user');
const promptRouter = require('./prompt');
const adminRouter = require('./admin');
const battleRouter = require('./battles');
const { Challenge, User, ChallengeSubmission } = require('../db');
const { authMiddleware } = require('../middleware');
const { addXp, updateStreak } = require('../gamification');
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.use("/user", userRouter);
router.use("/prompts", promptRouter);
router.use("/admin", adminRouter);
router.use("/battles", battleRouter);

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
        let challenges = await Challenge.find({
            type: 'weekly',
            $or: [
                { deadline: { $gt: new Date() } },
                { deadline: { $exists: false } },
                { deadline: null }
            ]
        }).sort({ createdAt: -1 });

        // Auto-rotation logic: If no unexpired challenge is currently active, pick a random one
        let activeChallenge = challenges.find(c => c.isActive);
        if (!activeChallenge && challenges.length > 0) {
            // Pick a random unexpired challenge
            const randomIndex = Math.floor(Math.random() * challenges.length);
            activeChallenge = challenges[randomIndex];

            // Deactivate any previously active expired challenges and activate the new one
            await Challenge.updateMany({ type: 'weekly', isActive: true }, { isActive: false });
            await Challenge.findByIdAndUpdate(activeChallenge._id, { isActive: true });

            // Update in-memory for the immediate response
            activeChallenge.isActive = true;
        }

        res.json({ challenges });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Public route to get leaderboard for a specific challenge
router.get("/challenges/:id/leaderboard", async (req, res) => {
    try {
        const { id } = req.params;
        const leaderboard = await ChallengeSubmission.find({ challengeId: id })
            .sort({ highestScore: -1, updatedAt: 1 }) // Highest score first, then earliest time
            .limit(10)
            .populate('userId', 'username firstName lastName level');

        res.json({ leaderboard });
    } catch (e) {
        console.error("Leaderboard fetch error", e);
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
        let finalXpGiven = 0;
        let streakInfo = { newStreak: 0, streakBonus: 1.0, streakMaintained: false };

        if (score >= 70) {
            xpAwarded = Math.floor((challenge.rewardXp || 100) * (score / 100)); // partial base XP
            const user = await User.findById(req.userId);
            if (user) {
                // Calculate streak multipliers before granting XP
                streakInfo = await updateStreak(user);

                const xpResult = await addXp(user, xpAwarded, streakInfo.streakBonus);
                leveledUp = xpResult.leveledUp;
                newLevel = xpResult.level;
                finalXpGiven = xpResult.finalAmount;

                await user.save();
            }
        }

        // Track submission high scores for Leaderboard
        try {
            const existingSubmission = await ChallengeSubmission.findOne({
                userId: req.userId,
                challengeId: challenge._id
            });

            if (existingSubmission) {
                if (score > existingSubmission.highestScore) {
                    existingSubmission.highestScore = score;
                    existingSubmission.bestPrompt = prompt;
                    existingSubmission.updatedAt = Date.now();
                    await existingSubmission.save();
                }
            } else {
                await ChallengeSubmission.create({
                    userId: req.userId,
                    challengeId: challenge._id,
                    highestScore: score,
                    bestPrompt: prompt
                });
            }
        } catch (subErr) {
            console.error("Failed to update challenge submission tracker:", subErr);
            // Non-fatal, let the request finish
        }

        res.json({
            score,
            feedback,
            xpAwarded: finalXpGiven,
            leveledUp,
            newLevel,
            streakInfo
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to submit challenge" });
    }
});

module.exports = router;
