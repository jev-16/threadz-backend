import express from "express";
import { productController } from "../controllers/productController.js";
import { upload } from "../utils/fileupload.js";

export const productRouter = express.Router();

productRouter.get("/category", productController.byCategory); // get all product from one category
productRouter
	.route("/:id")
	.get(productController.one) // get a single product
	.delete(productController.delete); // delete a product
productRouter.route("/").get(productController.all); // get all products
productRouter.post("/", upload.array("files"), productController.add); // add a single product
productRouter.patch("/:id", upload.single("img"), productController.edit); // add a single product
