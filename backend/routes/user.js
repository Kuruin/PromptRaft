require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");
const express = require("express");
const router = express.Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const z = require('zod');
const { signupSchema, signinSchema } = require("../schema");
const { connectDb, User } = require("../db");
const jwt = require("jsonwebtoken");
connectDb();

const { authMiddleware } = require("../middleware");
const { updateStreak, addXp } = require("../gamification");

router.get("/me", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if new day
        const changed = await updateStreak(user);
        if (changed) {
            await user.save();
        }

        res.json({ user });
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch user" });
    }
});

// Protected Route: Optimize Prompt
router.post("/optimize", authMiddleware, async (req, res) => {
    const { prompt } = req.body;

    // Award XP for using AI
    try {
        const user = await User.findById(req.userId);
        if (user) {
            await addXp(user, 20); // 20 XP for refining
            await user.save();
        }
    } catch (e) {
        console.error("XP Error", e);
    }

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            systemInstruction: process.env.SYSTEM_PROMPT,
        }
    });
    res.json({ response: response.text.split("Optimized prompt: ")[1] || "Looks like gemini is having some issues!" });
})

router.post("/secret-optimize", async (req, res) => {
    try {
        const parsedBody = req.body;
        const { prompt } = parsedBody;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: process.env.SECRET_PROMPT,
            }
        });
        res.json({
            score: response.text.split("\n")[0] || '0/100',
            feedback: response.text.split("\n")[1] || "We are working on it ",
            text: response.text
        });
    } catch (e) {
        console.error("AI Error:", e);
        // Return mock data or error to prevent frontend break
        res.status(503).json({
            score: '0/100',
            feedback: "AI Busy (Rate Limit or Error)",
            text: ""
        });
    }
})

router.post("/signup", async (req, res) => {
    const parsedBody = req.body;
    const { username, password, lastName, firstName } = parsedBody;
    const valid = signupSchema.safeParse(parsedBody);
    if (!valid.success) {
        return res.status(411).json({ msg: "Enter valid inputs" })
    }
    else {
        const dbCall = await User.findOne({ username })
        if (!dbCall) {
            const newUser = await User.create({
                username,
                password,
                firstName,
                lastName
            });
            const id = newUser._id.toString();
            const token = jwt.sign({ id }, process.env.SECRET_TOKEN);
            res.json({ msg: "User signed up successfully", token });
            return;
        }
        res.status(403).json({ error: "User already exists" })
    }
})

/*
    Wait, the previous logic was authenticating via TOKEN in HEADERS? 
    That's incorrect for a login route. It should take username/password from BODY.
    Fixed standard login flow.
*/
router.post("/signin", async (req, res) => {
    const { username, password } = req.body;

    // Validate input
    const valid = signinSchema.safeParse({ username, password });
    if (!valid.success) {
        return res.status(411).json({ error: "Invalid inputs" });
    }

    try {
        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check password (Text-based as per Schema, though bcrypt is recommended later)
        if (user.password !== password) {
            return res.status(401).json({ error: "Incorrect password" });
        }

        // Update Streak 
        await updateStreak(user);
        await user.save();

        // Generate Token
        const token = jwt.sign({ id: user._id }, process.env.SECRET_TOKEN);

        res.json({
            msg: "Signin successful",
            token,
            user: {
                _id: user._id,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                xp: user.xp,
                level: user.level,
                streak: user.streak
            }
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Server error during login" });
    }
});

module.exports = router;