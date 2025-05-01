import dotenv from "dotenv";
dotenv.config(); // Load environment variables first
import express from "express";
import morgan from "morgan";
import cors from "cors";
import connectDB from "./config/db.js";
import { requireSignin } from "./helpers/jwt.js";
import { errorHandler } from "./helpers/error-handler.js";

// import routes
import productRoutes from "./routes/product.js";
import categoryRoutes from "./routes/category.js";
import userRoutes from "./routes/user.js";
import orderRoutes from "./routes/order.js";
import authRoutes from "./routes/auth.js";
import brandRoutes from "./routes/brand.js";
import colorRoutes from "./routes/color.js";
import weightRoutes from "./routes/weight.js";
import ramRoutes from "./routes/ram.js";
import sizeRoutes from "./routes/size.js";
import reviewsRoutes from "./routes/reviews.js";

import cloudinary from "./config/cloudinary.js";

// connect to db
connectDB();

const app = express();
const api = process.env.API_URL;

// app middlewares
app.use(morgan("dev"));
app.use(requireSignin());
app.use(express.json());
app.use(cors());
app.options("*", cors());
app.use(errorHandler);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test if the configuration works
cloudinary.v2.api
  .ping()
  .then((result) => console.log("Cloudinary is configured:", result))
  .catch((err) => console.error("Error:", err));

// middleware
app.use(`${api}/products`, productRoutes);
app.use(`${api}/categories`, categoryRoutes);
app.use(`${api}/users`, userRoutes);
app.use(`${api}/orders`, orderRoutes);
app.use(`${api}/auth`, authRoutes);
app.use(`${api}/brands`, brandRoutes);
app.use(`${api}/colors`, colorRoutes);
app.use(`${api}/weights`, weightRoutes);
app.use(`${api}/rams`, ramRoutes);
app.use(`${api}/sizes`, sizeRoutes);
app.use(`${api}/reviews`, reviewsRoutes);

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
