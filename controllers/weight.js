import asyncHandler from "express-async-handler";
import Weight from "../models/weight.js";

const createWeight = asyncHandler(async (req, res) => {
  const { name } = req.body;

  // Check if weight already exists
  const weightExists = await Weight.findOne({ name });

  if (weightExists) {
    res.status(400).json({ message: "Weight already exists" });
    return;
  }

  const weight = await Weight.create({
    name,
  });

  if (weight) {
    res.status(201).json({
      id: weight._id,
      name: weight.name,
    });
  } else {
    res.status(400).json({ message: "Invalid weight data" });
  }
});

const updateWeight = asyncHandler(async (req, res) => {
  const { name } = req.body;

  const weight = await Weight.findById(req.params.id);

  if (!weight) {
    res.status(404).json({ message: "Weight not found" });
    return;
  }

  weight.name = name || weight.name;

  const updatedWeight = await weight.save();

  res.status(200).json({
    id: updatedWeight._id,
    name: updatedWeight.name,
  });
});

const deleteWeight = asyncHandler(async (req, res) => {
  const weight = await Weight.findById(req.params.id);

  if (!weight) {
    res.status(404).json({ message: "Weight not found" });
    return;
  }

  await weight.remove();

  res.status(200).json({ message: "Weight removed successfully" });
});

const getWeights = asyncHandler(async (req, res) => {
  const weights = await Weight.find();

  res.status(200).json(weights);
});

const getWeightById = asyncHandler(async (req, res) => {
  const weight = await Weight.findById(req.params.id);

  if (!weight) {
    res.status(404).json({ message: "Weight not found" });
    return;
  }

  res.status(200).json(weight);
});

const getWeightsByIds = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || ids.length === 0) {
    res.status(400).json({ message: "No IDs provided" });
    return;
  }

  const weights = await Weight.find({ _id: { $in: ids } });

  if (weights.length === 0) {
    res.status(404).json({ message: "No weight's found for the provided IDs" });
    return;
  }

  res.status(200).json(weights);
});

export {
  createWeight,
  updateWeight,
  getWeights,
  getWeightById,
  deleteWeight,
  getWeightsByIds,
};
