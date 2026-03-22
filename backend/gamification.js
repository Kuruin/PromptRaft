const { User } = require("./db");

// XP Thresholds: Level = floor(XP / 200) + 1
const XP_PER_LEVEL = 200;

/**
 * Calculates the level based on total XP
 */
const calculateLevel = (xp) => {
    return Math.floor(xp / XP_PER_LEVEL) + 1;
};

/**
 * Updates user streak based on when they last completed a challenge.
 * Call this ONLY when a user successfully completes a challenge.
 */
const updateStreak = async (user) => {
    const now = new Date();
    const last = user.lastChallengeDate ? new Date(user.lastChallengeDate) : null;
    let streakMaintained = false;
    let oldStreak = user.streak;

    if (!last) {
        // First ever challenge
        user.streak = 1;
        streakMaintained = true;
    } else {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());

        const diffTime = Math.abs(today - lastDay);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            // Already did a challenge today, keep current streak
            streakMaintained = true;
        } else if (diffDays === 1) {
            // Consecutive day
            user.streak += 1;
            streakMaintained = true;
        } else {
            // Missed a day
            user.streak = 1;
            streakMaintained = false;
        }
    }

    user.lastChallengeDate = now;

    // Calculate Bonus Multiplier
    let streakBonus = 1.0;
    if (user.streak >= 7) streakBonus = 1.5;
    else if (user.streak >= 3) streakBonus = 1.2;

    return {
        newStreak: user.streak,
        streakMaintained: streakMaintained || oldStreak === 0,
        streakBonus
    };
};

/**
 * Adds XP to user and handles level up, considering streak multiplier
 */
const addXp = async (user, baseAmount, streakBonus = 1.0) => {
    const finalAmount = Math.floor(baseAmount * streakBonus);
    user.xp += finalAmount;
    const newLevel = calculateLevel(user.xp);
    if (newLevel > user.level) {
        user.level = newLevel;
        return { leveledUp: true, level: newLevel, finalAmount };
    }
    return { leveledUp: false, level: user.level, finalAmount };
};

module.exports = {
    calculateLevel,
    updateStreak,
    addXp
};
