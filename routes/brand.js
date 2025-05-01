import express from "express";
import {
  createBrand,
  getBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
} from "../controllers/brand.js";

const router = express.Router();

router.route("/").post(createBrand).get(getBrands);

router.route("/:id").get(getBrandById).put(updateBrand).delete(deleteBrand);

export default router;
