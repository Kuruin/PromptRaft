const express = require('express');
const router = express.Router();
const { User, Challenge } = require('../db');
const { adminMiddleware } = require('../middleware');

// Create a new daily challenge
router.post('/challenges', adminMiddleware, async (req, res) => {
    try {
        const { title, description, targetCount, rewardXp, isActive } = req.body;

        // If this one is active, deactivate all others first
        if (isActive) {
            await Challenge.updateMany({}, { isActive: false });
        }

        const challenge = await Challenge.create({
            title,
            description,
            targetCount: targetCount || 3,
            rewardXp: rewardXp || 100,
            isActive: isActive || false
        });

        res.json({
            message: "Challenge created successfully",
            challenge
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get all challenges
router.get('/challenges', adminMiddleware, async (req, res) => {
    try {
        const challenges = await Challenge.find().sort({ createdAt: -1 });
        res.json({ challenges });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Set a challenge as active
router.put('/challenges/:id/active', adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        // Deactivate all
        await Challenge.updateMany({}, { isActive: false });

        // Activate requested challenge
        const challenge = await Challenge.findByIdAndUpdate(id, { isActive: true }, { new: true });

        if (!challenge) {
            return res.status(404).json({ message: "Challenge not found" });
        }

        res.json({
            message: "Challenge set as active successfully",
            challenge
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Delete a challenge
router.delete('/challenges/:id', adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        await Challenge.findByIdAndDelete(id);
        res.json({ message: "Challenge deleted successfully" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get all users
router.get('/users', adminMiddleware, async (req, res) => {
    try {
        // Exclude passwords from the query results
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json({ users });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Toggle user block status
router.put('/users/:id/block', adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.isAdmin) {
            return res.status(400).json({ message: "Cannot block an admin user" });
        }

        user.isBlocked = !user.isBlocked;
        await user.save();

        res.json({
            message: `User successfully ${user.isBlocked ? 'blocked' : 'unblocked'}`,
            user: { _id: user._id, isBlocked: user.isBlocked }
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
