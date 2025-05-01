import express from "express";

import {
  createRam,
  updateRam,
  getRams,
  getRamById,
  deleteRam,
  getRamsByIds,
} from "../controllers/ram.js";

const router = express.Router();

router.route("/").post(createRam).get(getRams);

router.route("/by-ids").post(getRamsByIds);

router.route("/:id").get(getRamById).put(updateRam).delete(deleteRam);

export default router;
