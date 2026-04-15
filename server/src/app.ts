import express from "express";
import cors from "cors";

import authRouter from "./modules/auth/auth.routes.js";

const app = express();

app.use(cors({
  origin: [
    "https://codesync-theta-ten.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
  ],
  credentials: true
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running.");
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRouter);

export default app;
