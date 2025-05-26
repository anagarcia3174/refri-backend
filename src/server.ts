import express from "express";
import { config } from "./config/config";
import { connectDB } from "./config/db-connection.config";
import cors from "cors";
import { errorHandler } from "./middleware/error-handler.middleware";
import authRoutes from "./routes/auth.route";
import cookieParser from "cookie-parser";
import path from "path";

connectDB();

const app = express();
const port = config.port || 3000;

// Middleware
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(
  cors({
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
