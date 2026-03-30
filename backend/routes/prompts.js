const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { SharedPrompt } = require('../db');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware');

// GET /api/v1/gallery - List all shared prompts (filtered by privacy)
router.get("/", optionalAuthMiddleware, async (req, res) => {
    try {
        const { sort, search, tag, mine } = req.query;
        let query = {};

        // If 'mine' is requested, only show the user's own prompts
        if (mine === 'true') {
            if (!req.userId) {
                return res.status(401).json({ message: "Login required to see your prompts" });
            }
            query.userId = new mongoose.Types.ObjectId(req.userId);
        } else {
            // Privacy Filter: Show public prompts OR prompts owned by the requester
            if (req.userId) {
                const userObjectId = new mongoose.Types.ObjectId(req.userId);
                query.$or = [
                    { isPrivate: false },
                    { userId: userObjectId }
                ];
            } else {
                query.isPrivate = false;
            }
        }

        if (search) {
            const searchFilter = {
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ]
            };
            // Merge search filter with privacy query
            if (query.$or) {
                query = { $and: [query, searchFilter] };
            } else {
                query = { ...query, ...searchFilter };
            }
        }

        if (tag) {
            query.tags = tag;
        }

        let sortOption = { createdAt: -1 };
        if (sort === 'top') {
            sortOption = { upvotesCount: -1, createdAt: -1 };
        }

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
                $lookup: {
                    from: "users",
                    localField: "contributors",
                    foreignField: "_id",
                    as: "contributorDetails"
                }
            },
            {
                $addFields: {
                    contributors: {
                        $map: {
                            input: "$contributorDetails",
                            as: "c",
                            in: {
                                _id: "$$c._id",
                                username: "$$c.username"
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    "author.password": 0,
                    "author.lastLoginDate": 0,
                    "author.isAdmin": 0,
                    "contributorDetails": 0
                }
            }
        ]);

        res.json({ prompts });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Internal server error" });
    }
});

// GET /api/v1/gallery/:id - Get a single prompt
router.get("/:id", optionalAuthMiddleware, async (req, res) => {
    try {
        const prompt = await SharedPrompt.findById(req.params.id).populate('userId', 'username');
        if (!prompt) {
            return res.status(404).json({ message: "Prompt not found" });
        }

        // Privacy Check
        if (prompt.isPrivate && (!req.userId || prompt.userId._id.toString() !== req.userId)) {
            return res.status(403).json({ message: "Unauthorized access to private prompt" });
        }

        res.json({ prompt });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Internal server error" });
    }
});

// POST /api/v1/gallery - Share a new prompt
router.post("/", authMiddleware, async (req, res) => {
    try {
        const {
            title,
            description,
            content,
            tags,
            isPrivate,
            isPromptAgent,
            requiresMedia,
            promptType,
            category,
            contributors,
            imageUrl,
            structuredFormat,
        } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: "Title and content are required" });
        }

        const sharedPrompt = await SharedPrompt.create({
            userId: req.userId,
            title,
            description,
            content,
            tags: tags || [],
            isPrivate: isPrivate || false,
            isPromptAgent: isPromptAgent || false,
            requiresMedia: requiresMedia || false,
            promptType: promptType || 'text',
            category: category || 'none',
            contributors: contributors || [],
            imageUrl: imageUrl || '',
            structuredFormat: structuredFormat || 'none'
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

// PUT /api/v1/gallery/:id - Update an existing prompt
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const prompt = await SharedPrompt.findById(req.params.id);
        if (!prompt) {
            return res.status(404).json({ message: "Prompt not found" });
        }

        if (prompt.userId.toString() !== req.userId) {
            return res.status(403).json({ message: "Unauthorized: Only the author can edit this prompt" });
        }

        const {
            title,
            description,
            content,
            tags,
            isPrivate,
            isPromptAgent,
            requiresMedia,
            promptType,
            category,
            contributors,
            imageUrl,
            structuredFormat,
        } = req.body;

        const updatedPrompt = await SharedPrompt.findByIdAndUpdate(
            req.params.id,
            {
                title,
                description,
                content,
                tags,
                isPrivate,
                isPromptAgent,
                requiresMedia,
                promptType,
                category,
                contributors,
                imageUrl,
                structuredFormat,
                updatedAt: Date.now()
            },
            { new: true }
        );

        res.json({
            message: "Prompt updated successfully",
            prompt: updatedPrompt
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Internal server error" });
    }
});

// POST /api/v1/gallery/:id/upvote - Toggle upvote
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
