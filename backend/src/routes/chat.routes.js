import express from "express";
import { 
    createOrGetChat, 
    getUserChats, 
    getChatMessages, 
    sendMessage, 
    deleteMessage, 
    toggleArchiveChat 
} from "../controllers/chat.controllers.js";
import { authenticate } from "../middlewares/auth.middleware.js";
// import { upload } from "../middlewares/multer.middleware.js";

const chatRouter = express.Router();

// All routes require authentication
chatRouter.use(authenticate);

// Chat management
chatRouter.post("/", createOrGetChat);
chatRouter.get("/", getUserChats);
chatRouter.patch("/:chatId/archive", toggleArchiveChat);

// Message management
chatRouter.get("/:chatId/messages", getChatMessages);
chatRouter.post("/:chatId/messages", sendMessage);
chatRouter.delete("/:chatId/messages/:messageId", deleteMessage);

export default chatRouter;