import express from "express";
import { cartController } from "../controllers/cartController.js";

export const cartRouter = express.Router();

cartRouter.get("/:user_id", cartController.userCart); // get cart items for a specific user
cartRouter.post("/", cartController.add); // add new item to a user's cart
cartRouter.delete("/:id", cartController.remove); // remove item from user cart
