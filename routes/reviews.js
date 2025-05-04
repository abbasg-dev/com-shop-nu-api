import express from "express";

const router = express.Router();

import {
  addReview,
  getReviews,
  reviewByUser,
  ratingById,
  editReview,
  deleteReview,
  likeReview,
  dislikeReview,
  filterReviews,
} from "../controllers/reviews.js";

router.post("/user", reviewByUser);
router.post("/:id", addReview);
router.get("/:id", getReviews);
router.get("/:id/percentages", ratingById);
router.put("/:id", editReview);
router.delete("/:id", deleteReview);
router.post("/:id/like", likeReview);
router.post("/:id/dislike", dislikeReview);
router.get("/:id/filter", filterReviews);

export default router;
