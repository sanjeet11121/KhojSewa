import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import authRouter from "./routes/auth.routes.js";
import postRouter from "./routes/post.routes.js";
import adminRouter from "./routes/admin.routes.js";
import userRoutes from "./routes/user.routes.js";
import claimRouter from "./routes/claim.routes.js";

import cosineMatchingRoutes from './routes/ml/cosineMatching.routes.js';
import realTimeMatchingRoutes from './routes/ml/realTimeMatching.routes.js';

// NEW: Import automated services
import MatchCronJob from './jobs/matchCronJob.js';
import AutomatedNotificationService from './services/automatedNotification.service.js';

import http from 'http';
import socketService from './services/socket.service.js';
import chatRouter from "./routes/chat.routes.js";

const app = express();

// After creating express app
const server = http.createServer(app);

// Initialize socket service
socketService.initialize(server);

// Needed for __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

console.log('CORS configured with origin:', process.env.CORS_ORIGIN || 'http://localhost:5173');

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public"))); // serve static files

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/users", userRoutes);
app.use('/api/v1/claims', claimRouter);
app.use("/api/v1/admin", adminRouter);
app.use('/api/v1/chat', chatRouter);

// ML Routes
app.use('/api/v1/cosine-matching', cosineMatchingRoutes);
app.use('/api/v1/real-time-matching', realTimeMatchingRoutes);

// NEW: Monitoring Routes (for admin/status checking)
app.get('/api/v1/monitoring/status', (req, res) => {
    res.json({
        success: true,
        data: {
            monitoring: AutomatedNotificationService.getStatus(),
            cronJobs: MatchCronJob.getStatus()
        }
    });
});

// NEW: Monitoring control routes (admin only)
app.post('/api/v1/monitoring/start', (req, res) => {
    AutomatedNotificationService.startMonitoring();
    res.json({ 
        success: true,
        message: 'Automatic monitoring started' 
    });
});

app.post('/api/v1/monitoring/stop', (req, res) => {
    AutomatedNotificationService.stopMonitoring();
    res.json({ 
        success: true,
        message: 'Automatic monitoring stopped' 
    });
});

app.post('/api/v1/monitoring/process-all', async (req, res) => {
    try {
        await AutomatedNotificationService.processAllExistingPosts();
        res.json({ 
            success: true,
            message: 'Processing all existing posts completed' 
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error processing posts: ' + error.message
        });
    }
});

app.post('/api/v1/monitoring/clear-cache', (req, res) => {
    AutomatedNotificationService.clearCache();
    res.json({ 
        success: true,
        message: 'Monitoring cache cleared' 
    });
});

// ✅ Serve 404.html for unmatched routes
app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// NEW: Start automated services when server starts
const startAutomatedServices = () => {
    if (process.env.ENABLE_AUTO_MATCHING === 'true') {
        console.log('🚀 Starting automated matching system...');
        AutomatedNotificationService.startMonitoring();
        MatchCronJob.start();
        console.log('✅ Automatic matching system started!'); // Added checkmark for consistency
    } else {
        console.log('  ⚠️ Auto-matching disabled (set ENABLE_AUTO_MATCHING=true to enable)'); // Added warning icon for clarity
    }
};

// --- MODIFIED EXPORT ---
// Export the HTTP server instance as 'server' for the main entry point to listen on,
// and export the function to start services.
export { server, startAutomatedServices };
// Note: We no longer export 'app' separately, as 'server' (the HTTP server) is what is needed for listening.
