import express from "express";

import {
  createWeight,
  updateWeight,
  getWeights,
  getWeightById,
  deleteWeight,
  getWeightsByIds,
} from "../controllers/weight.js";

const router = express.Router();

router.route("/").post(createWeight).get(getWeights);

router.route("/by-ids").post(getWeightsByIds);

router.route("/:id").get(getWeightById).put(updateWeight).delete(deleteWeight);

export default router;
