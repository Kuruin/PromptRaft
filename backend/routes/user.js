require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");
const express = require("express");
const router = express.Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const z = require('zod');
const { signupSchema } = require("../schema");
const { connectDb, User } = require("../db");
connectDb();

router.post("/optimize", async (req, res) => {
    const parsedBody = req.body;
    const { prompt } = parsedBody;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            systemInstruction: process.env.SYSTEM_PROMPT,
        }
    });
    res.json({ response: response.text.split("Optimized prompt: ")[1] })
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
            await User.create({
                username,
                password,
                firstName,
                lastName
            })
            res.json({ msg: "User signed up successfully" });
            return;
        }
        res.status(403).json({ error: "User already exists" })
    }
})


module.exports = router;