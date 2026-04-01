require('dotenv').config();
const express = require("express");
const cors = require('cors');
const { connectDb } = require("./db");
const rootRouter = require("./routes/index");
const adminRouter = require('./routes/admin');
const promptRouter = require('./routes/prompts');

const app = express();
const port = 3000;

// Connect to Database
connectDb();

app.use(cors({
    origin: ['http://localhost:8080', 'http://localhost:4173'], // Replace with your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
// 1. Root API (Includes /user, /challenges, /admin, and personal /prompts)
app.use("/api/v1", rootRouter);

// 2. Explicit Gallery API (to avoid singular/plural collision)
app.use('/api/v1/gallery', promptRouter);

// Health check
app.get("/", (req, res) => {
    res.json({ message: "PromptRaft API is running" });
});

app.listen(port, () => console.log("Listening on port " + port));