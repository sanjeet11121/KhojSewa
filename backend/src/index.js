import dotenv from "dotenv";
import { server, startAutomatedServices } from "./app.js"; // Updated import
import connectDB from "./db/index.js";

dotenv.config({
    path: "./.env"
})

connectDB()
    .then(() => {
        server.listen(process.env.PORT || 8000, () => {
            console.log(`🚀 Server is running at port: ${process.env.PORT}`);
            
            // NEW: Start automated services AFTER server starts
            startAutomatedServices();
        })
    })
    .catch((err) => {
        console.log("❌ MongoDB connection failed !!!", err);
    })