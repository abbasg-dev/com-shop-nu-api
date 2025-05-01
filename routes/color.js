import express from "express";

import {
  createColor,
  updateColor,
  getColors,
  getColorById,
  getColorsByIds,
  deleteColor,
} from "../controllers/color.js";

const router = express.Router();

router.route("/").post(createColor).get(getColors);

router.route("/by-ids").post(getColorsByIds);

router.route("/:id").get(getColorById).put(updateColor).delete(deleteColor);

export default router;
