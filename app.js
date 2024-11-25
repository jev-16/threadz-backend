import express from "express";
import morgan from "morgan";
import cors from "cors"; 

// import routes
import { authRouter } from "./routes/authRouter.js";
import { productRouter } from "./routes/productRouter.js";
import { categoryRouter } from "./routes/categoryRouter.js";
import { cartRouter } from "./routes/cartRouter.js";
import { orderRouter } from "./routes/orderRouter.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); 

app.use("/assets", express.static("assets"));

app.options("*", cors(["http://localhost:4200"]));
app.use(cors(["http://localhost:4200"]));

// use routes
app.use("/api_v1/auth", authRouter);
app.use("/api_v1/products", productRouter);
app.use("/api_v1/categories", categoryRouter);
app.use("/api_v1/cart", cartRouter);
app.use("/api_v1/order", orderRouter);

app.listen(PORT, () => {
	console.log(`listening on port ${3000} | http://localhost:${PORT}/`);
});
