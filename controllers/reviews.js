import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import Product from "../models/product.js";

const addReview = asyncHandler(async (req, res) => {
  const { user, rating, comment } = req.body;

  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const review = {
    user,
    rating,
    comment,
  };

  product.reviews.push(review);

  product.numReviews = product.reviews.length;

  const totalRating = product.reviews.reduce(
    (acc, review) => acc + review.rating,
    0
  );
  product.rating = totalRating / product.numReviews;

  await product.save();
  res.status(201).json({ message: "Review added successfully", product });
});

const getReviews = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate(
    "reviews.user"
  );
  if (product) {
    res.json(product.reviews);
  } else {
    res.status(404).json({ message: "Product not found" });
  }
});

const editReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const userId = req.user._id; // Assuming user is authenticated

  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const review = product.reviews.find(
    (rev) => rev.user.toString() === userId.toString()
  );

  if (!review) {
    return res.status(404).json({ message: "Review not found" });
  }

  review.rating = rating ?? review.rating;
  review.comment = comment ?? review.comment;

  // Recalculate product rating
  const totalRating = product.reviews.reduce(
    (acc, review) => acc + review.rating,
    0
  );
  product.rating = totalRating / product.reviews.length;

  await product.save();
  res.json({ message: "Review updated successfully", product });
});

const deleteReview = asyncHandler(async (req, res) => {
  const userId = req.user._id; // Assuming user is authenticated

  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const reviewIndex = product.reviews.findIndex(
    (rev) => rev.user.toString() === userId.toString()
  );

  if (reviewIndex === -1) {
    return res.status(404).json({ message: "Review not found" });
  }

  product.reviews.splice(reviewIndex, 1);
  product.numReviews = product.reviews.length;

  // Recalculate rating
  const totalRating = product.reviews.reduce(
    (acc, review) => acc + review.rating,
    0
  );
  product.rating =
    product.numReviews > 0 ? totalRating / product.numReviews : 0;

  await product.save();
  res.json({ message: "Review deleted successfully", product });
});

const likeReview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { reviewId } = req.body;

  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const review = product.reviews.id(reviewId);
  if (!review) {
    return res.status(404).json({ message: "Review not found" });
  }

  // Remove user from dislikes if exists
  review.dislikes = review.dislikes.filter(
    (id) => id.toString() !== userId.toString()
  );

  // Toggle like
  if (review.likes.includes(userId)) {
    review.likes = review.likes.filter(
      (id) => id.toString() !== userId.toString()
    );
  } else {
    review.likes.push(userId);
  }

  await product.save();
  res.json({ message: "Review liked/disliked successfully", product });
});

const dislikeReview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { reviewId } = req.body;

  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const review = product.reviews.id(reviewId);
  if (!review) {
    return res.status(404).json({ message: "Review not found" });
  }

  // Remove user from likes if exists
  review.likes = review.likes.filter(
    (id) => id.toString() !== userId.toString()
  );

  // Toggle dislike
  if (review.dislikes.includes(userId)) {
    review.dislikes = review.dislikes.filter(
      (id) => id.toString() !== userId.toString()
    );
  } else {
    review.dislikes.push(userId);
  }

  await product.save();
  res.json({ message: "Review disliked/liked successfully", product });
});

const filterReviews = asyncHandler(async (req, res) => {
  const { rating, sortBy } = req.query;

  const product = await Product.findById(req.params.id).populate(
    "reviews.user"
  );
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  let filteredReviews = product.reviews;

  // Filter by rating if specified
  if (rating) {
    filteredReviews = filteredReviews.filter(
      (review) => review.rating === Number(rating)
    );
  }

  // Sort based on query param
  switch (sortBy) {
    case "top":
      filteredReviews.sort(
        (a, b) =>
          b.likes.length -
          b.dislikes.length -
          (a.likes.length - a.dislikes.length)
      );
      break;
    case "recent":
      filteredReviews.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      break;
    case "highest":
      filteredReviews.sort((a, b) => b.rating - a.rating);
      break;
    case "lowest":
      filteredReviews.sort((a, b) => a.rating - b.rating);
      break;
    default:
      break;
  }

  res.json(filteredReviews);
});

/**
 * Get rating breakdown and overall rating stats for a specific product.
 * Percentages of each rating level (1–5)
 * Average rating out of 5
 * Rating total based on how many valid ratings are in reviews
 */
const ratingById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate the id parameter before proceeding
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  try {
    // Continue with the logic to fetch the product
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const reviews = product.reviews ?? [];

    if (product.numReviews === 0) {
      return res.json({
        ratingPercentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        overallPercentage: 0,
        numRatings: 0,
      });
    }

    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let numRatings = 0;

    for (const { rating } of reviews) {
      const r = Number(rating);
      if (r >= 1 && r <= 5) {
        ratingCounts[r]++;
        numRatings++;
      }
    }

    const ratingPercentages = {};
    for (let r = 1; r <= 5; r++) {
      ratingPercentages[r] = parseFloat(
        ((ratingCounts[r] / product.numReviews) * 100).toFixed(1)
      );
    }

    const overallPercentage = parseFloat(
      ((product.rating / 5) * 100).toFixed(1)
    );

    return res.json({
      ratingPercentages,
      overallPercentage,
      numRatings,
    });
  } catch (err) {
    console.error("Error fetching product:", err);
    return res.status(500).json({ message: "Error fetching product data" });
  }
});

export {
  addReview,
  getReviews,
  ratingById,
  editReview,
  deleteReview,
  likeReview,
  dislikeReview,
  filterReviews,
};
