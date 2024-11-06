import express from "express";
import { orderController } from "../controllers/orderController.js";

export const orderRouter = express.Router();

orderRouter.get("/", orderController.all); // get all orders 
orderRouter.get("/user/:user_id", orderController.userOrders); // get all orders for one user 
orderRouter.get("/:id", orderController.one) // get a single order 
orderRouter.post("/", orderController.add); // add a new order 
