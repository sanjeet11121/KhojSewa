import cors from "cors";
import express from "express";
import authRouter from "./routes/auth.routes.js";
import postRouter from "./routes/post.routes.js";
const app = express();

//middlewares
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}))
app.use(express.json({
    limit: "16kb"
}))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))

import cookieParser from "cookie-parser";

app.use(cookieParser());

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/post", postRouter);

// 404 handler for undefined routes
app.use("*", (req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found"
    });
});


export { app };