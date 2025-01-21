import express from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import connectDB from "./config/db.js";
import { requireSignin } from "./helpers/jwt.js";
import { errorHandler } from "./helpers/error-handler.js";

// import routes
import productRoutes from "./routes/product.js";
import categoryRoutes from "./routes/category.js";
import userRoutes from "./routes/user.js";
import orderRoutes from "./routes/order.js";
import authRoutes from "./routes/auth.js";

dotenv.config();

// connect to db
connectDB();

const app = express();
const api = process.env.API_URL;
const __dirname = path.resolve();

// app middlewares
app.use(morgan("dev"));
app.use(requireSignin());
app.use(express.json());
app.use(
  "/public/uploads",
  express.static(path.join(__dirname + "/public/uploads"))
);
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors());
app.use(errorHandler);

// middleware
app.use(`${api}/products`, productRoutes);
app.use(`${api}/categories`, categoryRoutes);
app.use(`${api}/users`, userRoutes);
app.use(`${api}/orders`, orderRoutes);
app.use(`${api}/auth`, authRoutes);

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
