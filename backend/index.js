const express = require("express");
const app = express();
const port = 3000;
const cors = require('cors')
const rootRouter = require("./routes/index")

app.use(cors({
    origin: 'http://localhost:8080', // Replace with your frontend URL if different
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());
app.use("/api/v1", rootRouter);


app.listen(port, () => console.log("Listening on port " + port))