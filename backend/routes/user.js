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

router.post("/signin", async (req, res) => {
    const { authorization } = req.headers;
    const token = authorization.split(" ")[1]
    const valid = signinSchema.safeParse(parsedBody);

    if (!valid.success || token == null) {
        return res.status(404).json({ error: "Enter valid credentials / token" })
    }

    try {
        jwt.verify(token, process.env.SECRET_TOKEN);
        res.json({ msg: "Signin successfull" });
    }
    catch (e) {
        console.log(e);
        res.status(400).json({ error: "Enter valid token" });
    }

})

module.exports = router;