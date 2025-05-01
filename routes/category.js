import express from "express";
import {
  create,
  list,
  remove,
  update,
  getById,
} from "../controllers/category.js";

const router = express.Router();

router.post("/", (req, res) => create(req, res));
router.get("/", list);
router
  .route("/:id")
  .delete(remove)
  .get(getById)
  .put((req, res) => update(req, res));

export default router;
