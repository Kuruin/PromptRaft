const express = require('express');
const router = express.Router();
const { SharedPrompt } = require('../db');
const { authMiddleware } = require('../middleware');

// GET /api/v1/prompts - List all shared prompts
router.get("/", async (req, res) => {
    try {
        const { sort, search, tag } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        if (tag) {
            query.tags = tag;
        }

        let sortOption = { createdAt: -1 };
        if (sort === 'top') {
            sortOption = { upvotesCount: -1, createdAt: -1 };
        }

        // We use aggregation to sort by upvotes count if needed
        const prompts = await SharedPrompt.aggregate([
            { $match: query },
            {
                $addFields: {
                    userId: { $toObjectId: "$userId" },
                    tags: { $ifNull: ["$tags", []] },
                    upvotes: { $ifNull: ["$upvotes", []] }
                }
            },
            {
                $addFields: {
                    upvotesCount: { $size: "$upvotes" }
                }
            },
            { $sort: sortOption },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "author"
                }
            },
            { $unwind: "$author" },
            {
                $project: {
                    "author.password": 0,
                    "author.lastLoginDate": 0,
                    "author.isAdmin": 0
                }
            }
        ]);

        res.json({ prompts });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Internal server error" });
    }
});

// POST /api/v1/prompts - Share a new prompt
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { title, description, content, tags } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: "Title and content are required" });
        }

        const sharedPrompt = await SharedPrompt.create({
            userId: req.userId,
            title,
            description,
            content,
            tags: tags || []
        });

        res.status(201).json({
            message: "Prompt shared successfully",
            prompt: sharedPrompt
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Internal server error" });
    }
});

// POST /api/v1/prompts/:id/upvote - Toggle upvote
router.post("/:id/upvote", authMiddleware, async (req, res) => {
    try {
        const prompt = await SharedPrompt.findById(req.params.id);
        if (!prompt) {
            return res.status(404).json({ message: "Prompt not found" });
        }

        const userId = req.userId;
        const upvoteIndex = prompt.upvotes.indexOf(userId);

        if (upvoteIndex === -1) {
            // Upvote
            prompt.upvotes.push(userId);
        } else {
            // Remove upvote
            prompt.upvotes.splice(upvoteIndex, 1);
        }

        await prompt.save();
        res.json({
            message: upvoteIndex === -1 ? "Upvoted" : "Upvote removed",
            upvotesCount: prompt.upvotes.length,
            isUpvoted: upvoteIndex === -1
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Internal server error" });
    }
});

// DELETE /api/v1/prompts/:id - Delete a shared prompt
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const prompt = await SharedPrompt.findById(req.params.id);
        if (!prompt) {
            return res.status(404).json({ message: "Prompt not found" });
        }

        if (prompt.userId.toString() !== req.userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        await SharedPrompt.findByIdAndDelete(req.params.id);
        res.json({ message: "Prompt deleted successfully" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
