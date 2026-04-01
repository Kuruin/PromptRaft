const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware');
const { Battle, User } = require('../db');
const { addXp } = require('../gamification');
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// GET /api/v1/battles - List Open & Completed Battles
router.get("/", async (req, res) => {
    try {
        const battles = await Battle.find()
            .populate('challengerId', 'username level')
            .populate('opponentId', 'username level')
            .populate('winnerId', 'username level')
            .sort({ createdAt: -1 });
        res.json({ battles });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch battles" });
    }
});

// POST /api/v1/battles/global - Admin Create Global Battle
router.post("/global", authMiddleware, async (req, res) => {
    try {
        const adminUser = await User.findById(req.userId);
        if (!adminUser.isAdmin) return res.status(403).json({ error: "Unauthorized" });

        const { targetGoal, maxTokens, betAmount } = req.body;
        const battle = await Battle.create({
            isGlobal: true,
            targetGoal,
            maxTokens: Number(maxTokens),
            betAmount: Number(betAmount) || 0
        });

        res.status(201).json({ msg: "Global Battle created", battle });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to create global battle" });
    }
});

// POST /api/v1/battles - Create an Open Battle
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { targetGoal, maxTokens, betAmount, challengerPrompt } = req.body;
        const bet = Number(betAmount) || 0;

        // Verify challenger has enough XP
        const challenger = await User.findById(req.userId);
        if (challenger.xp < bet) {
            return res.status(400).json({ error: "Insufficient XP to bet" });
        }

        // Deduct bet from challenger
        if (bet > 0) {
            challenger.xp -= bet;
            await challenger.save();
        }

        const battle = await Battle.create({
            challengerId: req.userId,
            targetGoal,
            maxTokens: Number(maxTokens),
            betAmount: bet,
            challengerPrompt
        });

        res.status(201).json({ msg: "Battle created successfully", battle });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to create battle" });
    }
});

// POST /api/v1/battles/:id/accept - Accept Battle & Trigger AI Judge
router.post("/:id/accept", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { opponentPrompt } = req.body;

        const battle = await Battle.findById(id).populate('challengerId', 'username level');
        if (!battle) return res.status(404).json({ error: "Battle not found" });

        if (battle.status !== "open") {
            return res.status(400).json({ error: "Battle is no longer open" });
        }

        if (battle.isGlobal && !battle.challengerId) {
            // Player 1 joining global battle
            const p1 = await User.findById(req.userId);
            if (p1.xp < battle.betAmount) return res.status(400).json({ error: "Insufficient XP to enter" });

            p1.xp -= battle.betAmount;
            await p1.save();

            battle.challengerId = p1._id;
            battle.challengerPrompt = opponentPrompt;
            await battle.save();

            return res.json({ msg: "Joined as Player 1", battle, status: "waiting" });
        }

        if (battle.challengerId && battle.challengerId._id.toString() === req.userId) {
            return res.status(400).json({ error: "You cannot accept your own battle" });
        }

        // Player 2 or normal opponent joining
        const opponent = await User.findById(req.userId);
        if (opponent.xp < battle.betAmount) {
            return res.status(400).json({ error: "Insufficient XP to match this bet" });
        }

        // Lock battle state immediately
        battle.status = "completed";
        battle.opponentId = opponent._id;
        battle.opponentPrompt = opponentPrompt;
        battle.updatedAt = Date.now();
        await battle.save();

        // Deduct bet from opponent
        if (battle.betAmount > 0) {
            opponent.xp -= battle.betAmount;
            await opponent.save();
        }

        // AI Judging Logics
        const systemInstruction = `You are an impartial AI programming judge. Your job is to strictly evaluate two prompts based ONLY on reaching a strict goal.
Return ONLY a valid JSON object with EXACTLY three properties: "winner" ("challenger", "opponent", or "tie"), "reasoning" (string), and "challengerValid" (bool) and "opponentValid" (bool).
Rules: A prompt MUST be under the token constraint to be valid. 1 Token = roughly 4 characters. If both pass the constraint, judge on which prompt gives clearer, more efficient instructions to reach the goal.`;

        const userContent = `Target Goal: ${battle.targetGoal}\nMax Tokens Allowed: ${battle.maxTokens} (Appx ${battle.maxTokens * 4} chars)\n\nChallenger Prompt (Length: ${battle.challengerPrompt.length}):\n${battle.challengerPrompt}\n\nOpponent Prompt (Length: ${opponentPrompt.length}):\n${opponentPrompt}`;

        let aiResultStr = "";
        let aiResult = { winner: "tie", reasoning: "Judging failed.", challengerValid: false, opponentValid: false };

        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: userContent,
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: "application/json"
                }
            });
            aiResultStr = response.text;
            aiResult = JSON.parse(aiResultStr);
        } catch (apiError) {
            console.error("Gemini API Error:", apiError);
            aiResult.reasoning = "The Judges experienced a technical difficulty.";
        }

        // Determine winner & pay out
        const potSize = battle.betAmount * 2;
        let winnerDoc = null;

        if (aiResult.winner === "challenger") {
            battle.winnerId = battle.challengerId._id;
            winnerDoc = await User.findById(battle.challengerId._id);
        } else if (aiResult.winner === "opponent") {
            battle.winnerId = opponent._id;
            winnerDoc = opponent; // Already loaded
        }

        battle.aiReasoning = aiResult.reasoning;
        await battle.save();

        if (winnerDoc && potSize > 0) {
            // we bypass gamification 'limit' and directly add
            winnerDoc.xp += potSize;
            await winnerDoc.save();
        } else if (aiResult.winner === "tie" && battle.betAmount > 0) {
            // Refund bets
            opponent.xp += battle.betAmount;
            await opponent.save();
            const challengerDoc = await User.findById(battle.challengerId._id);
            challengerDoc.xp += battle.betAmount;
            await challengerDoc.save();
        }

        res.json({
            msg: "Battle completed",
            battle,
            winner: aiResult.winner,
            reasoning: aiResult.reasoning,
            potSize
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to process battle" });
    }
});

module.exports = router;
