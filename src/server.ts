import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/dbConnection';
import cors from 'cors';
import { errorHandler } from './middleware/error-handler';
import authRoutes from './routes/auth.route';

dotenv.config();

connectDB();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

