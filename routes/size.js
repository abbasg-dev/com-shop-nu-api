import express from "express";

import {
  createSize,
  updateSize,
  getSizes,
  getSizeById,
  deleteSize,
  getSizesByIds,
} from "../controllers/size.js";

const router = express.Router();

router.route("/").post(createSize).get(getSizes);

router.route("/by-ids").post(getSizesByIds);

router.route("/:id").get(getSizeById).put(updateSize).delete(deleteSize);

export default router;
