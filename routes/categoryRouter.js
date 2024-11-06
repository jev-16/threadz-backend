import express from "express";
import { categoryController } from "../controllers/categoryController.js";

export const categoryRouter = express.Router();

categoryRouter
	.route("/")
	.get(categoryController.all) // get all categories
	.post(categoryController.add); // add new category
categoryRouter
	.route("/:id")
	.get(categoryController.one) // get one category
	.patch(categoryController.edit) // edit a category
	.delete(categoryController.delete); // delete a category
