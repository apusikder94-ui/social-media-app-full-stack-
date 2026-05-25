import express from "express";
const app = express();
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import { DataBase } from "./config/db";
import { authRoutes } from "./routes/authRoutes";
import { postRoutes } from "./routes/postRoutes";
import { commentRoutes } from "./routes/commentRoutes";
dotenv.config();
DataBase();

const PORT = 5000;

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "https://social-media-app-full-stack.vercel.app",
    credentials: true,
  })
);
app.use("/api/auth", authRoutes);
app.use("/api/post", postRoutes);
app.use("/api/comment", commentRoutes);

app.listen(PORT, () => {
  console.log(`This server is running on port ${PORT}`);
});
