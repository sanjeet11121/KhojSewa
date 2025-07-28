import cors from "cors";
import express from "express";
import authRouter from "./routes/auth.routes.js";
import postRouter from "./routes/post.routes.js";
import adminRouter from "./routes/admin.routes.js";
const app = express();

//middlewares
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))

// Log CORS configuration
console.log('CORS configured with origin:', process.env.CORS_ORIGIN || 'http://localhost:5173');
app.use(express.json({
    limit: "16kb"
}))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))

import cookieParser from "cookie-parser";


app.use(cookieParser());

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/admin", adminRouter);
// 404 handler for undefined routes
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found"
    });
    next();
});

// Global error handler (must be last)
app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
});


export { app };
