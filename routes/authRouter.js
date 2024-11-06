import { authController } from "../controllers/auth.js";
import express from "express";

export const authRouter = express.Router();

authRouter.post("/login", authController.login);
authRouter.post("/signup", authController.signup);
