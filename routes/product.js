import express from "express";
const router = express.Router();

import {
  create,
  updateProduct,
  list,
  productById,
  deleteProduct,
  countProducts,
  countFeaturedProducts,
  countFeaturedByCategory,
  getHighestPrice,
} from "../controllers/product.js";

router.get("/highest-price", getHighestPrice);

router.get("/", list);
router.post("/", (req, res) => create(req, res));
router.route("/:id").put((req, res) => updateProduct(req, res));
router.get("/:id", productById);
router.delete("/:id", deleteProduct);
router.get("/get/count", countProducts);
router.get("/get/featured/:count", countFeaturedProducts);
router.get("/get/featured-by-category/:count", countFeaturedByCategory);

export default router;
