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
 * Updates user streak based on last login date.
 * Should be called on every identifiable "active" day (e.g., login or first action of day).
 */
const updateStreak = async (user) => {
    const now = new Date();
    const last = new Date(user.lastLoginDate);

    // Reset hours to compare calendar days only
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());

    const diffTime = Math.abs(today - lastDay);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        // Same day, do nothing
        return false;
    } else if (diffDays === 1) {
        // Consecutive day
        user.streak += 1;
    } else {
        // Missed a day (or more), reset
        user.streak = 1;
    }

    user.lastLoginDate = now;
    // Note: We don't save here, caller must save
    return true;
};

/**
 * Adds XP to user and handles level up
 */
const addXp = async (user, amount) => {
    user.xp += amount;
    const newLevel = calculateLevel(user.xp);
    if (newLevel > user.level) {
        user.level = newLevel;
        return { leveledUp: true, level: newLevel };
    }
    return { leveledUp: false, level: user.level };
};

module.exports = {
    calculateLevel,
    updateStreak,
    addXp
};
