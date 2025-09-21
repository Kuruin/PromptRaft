const { GoogleGenAI } = require("@google/genai");

const express = require("express");
const router = express.Router();
require("dotenv").config();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

module.exports = router;