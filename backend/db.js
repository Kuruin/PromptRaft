const mongoose = require('mongoose');

const connectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGO_DB_URL);
        console.log("Database connected")
    }
    catch (e) {
        console.log("Error connecting to DB" + e);
        process.exit(1);
    }
}

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minLength: 3,
        maxLength: 30
    },
    password: {
        type: String,
        required: true,
        minLength: 6
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    streak: { type: Number, default: 0 },
    lastLoginDate: { type: Date, default: Date.now },
    isAdmin: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const promptSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const promptVersionSchema = new mongoose.Schema({
    promptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prompt', required: true },
    versionNumber: { type: Number, required: true },
    content: { type: String, required: true },
    refinedContent: { type: String }, // Stores the AI's output for this version
    aiFeedback: String,
    aiScore: Number,
    createdAt: { type: Date, default: Date.now }
});

const challengeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    targetCount: { type: Number, required: true, default: 3 },
    rewardXp: { type: Number, required: true, default: 100 },
    type: { type: String, enum: ['daily', 'weekly'], default: 'daily' },
    isActive: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const settingsSchema = new mongoose.Schema({
    isMaintenanceMode: { type: Boolean, default: false }
});

const User = mongoose.model("User", userSchema);
const Prompt = mongoose.model("Prompt", promptSchema);
const PromptVersion = mongoose.model("PromptVersion", promptVersionSchema);
const Challenge = mongoose.model("Challenge", challengeSchema);
const Settings = mongoose.model("Settings", settingsSchema);

module.exports = { connectDb, User, Prompt, PromptVersion, Challenge, Settings }