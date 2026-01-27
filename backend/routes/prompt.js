const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware");
const { User, Prompt, PromptVersion } = require("../db");
const { addXp } = require("../gamification");
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Create a new Prompt Project
router.post("/", authMiddleware, async (req, res) => {
    const { title, description, initialContent, initialRefinedContent } = req.body;

    try {
        const newPrompt = await Prompt.create({
            userId: req.userId,
            title: title || "Untitled Project",
            description: description || ""
        });

        // Create the first version (V1)
        if (initialContent) {
            await PromptVersion.create({
                promptId: newPrompt._id,
                versionNumber: 1,
                content: initialContent,
                refinedContent: initialRefinedContent || "",
                aiFeedback: "Initial Draft",
                aiScore: 0
            });
        }

        // Award XP for creating a project
        try {
            const user = await User.findById(req.userId);
            if (user) {
                await addXp(user, 50);
                await user.save();
            }
        } catch (e) { console.error("XP Error", e); }

        res.json({
            message: "Prompt project created",
            promptId: newPrompt._id
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to create prompt project" });
    }
});

// Get all Prompts for the user
router.get("/", authMiddleware, async (req, res) => {
    try {
        const prompts = await Prompt.find({ userId: req.userId }).sort({ updatedAt: -1 });
        res.json({ prompts });
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch prompts" });
    }
});

// Get a specific Prompt with its Version History
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const prompt = await Prompt.findOne({ _id: req.params.id, userId: req.userId });
        if (!prompt) {
            return res.status(404).json({ error: "Prompt not found" });
        }

        const versions = await PromptVersion.find({ promptId: prompt._id }).sort({ versionNumber: -1 });

        res.json({
            prompt,
            versions
        });
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch prompt details" });
    }
});

// Add a NEW Version (Manually saved or AI Refined)
router.post("/:id/version", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { content, aiFeedback, aiScore, refinedContent } = req.body;

        const prompt = await Prompt.findOne({ _id: id, userId: req.userId });
        if (!prompt) {
            return res.status(404).json({ error: "Prompt project not found" });
        }

        // Get count for version numbering
        const count = await PromptVersion.countDocuments({ promptId: id });

        // Idempotency Check: Get the latest version to see if content has changed
        const latestVersion = await PromptVersion.findOne({ promptId: id }).sort({ versionNumber: -1 });

        if (latestVersion &&
            latestVersion.content === content &&
            (latestVersion.refinedContent || "") === (refinedContent || "")) {
            return res.json({
                msg: "Version already exists",
                version: latestVersion
            });
        }

        const newVersion = await PromptVersion.create({
            promptId: id,
            versionNumber: count + 1,
            content,
            refinedContent: refinedContent || "", // Save it!
            aiFeedback,
            aiScore
        });

        // Award XP for saving a version
        try {
            const user = await User.findById(req.userId);
            if (user) {
                await addXp(user, 10);
                await user.save();
            }
        } catch (e) { console.error("XP Error", e); }

        // Update prompt updated timestamp
        prompt.updatedAt = Date.now();
        await prompt.save();

        res.json({
            msg: "Version added",
            version: newVersion
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to create version" });
    }
});


// Delete a Version
router.delete("/:id/version/:versionId", authMiddleware, async (req, res) => {
    try {
        const { id, versionId } = req.params;

        // Verify ownership
        const prompt = await Prompt.findOne({ _id: id, userId: req.userId });
        if (!prompt) return res.status(404).json({ error: "Prompt not found" });

        // Delete version
        await PromptVersion.deleteOne({ _id: versionId, promptId: id });

        res.json({ msg: "Version deleted" });
    } catch (e) {
        res.status(500).json({ error: "Failed to delete" });
    }
});

module.exports = router;
