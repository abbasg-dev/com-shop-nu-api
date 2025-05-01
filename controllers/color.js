import asyncHandler from "express-async-handler";
import Color from "../models/color.js";

const createColor = asyncHandler(async (req, res) => {
  const { name, code } = req.body;

  const colorExists = await Color.findOne({ name });

  if (colorExists) {
    res.status(400).json({ message: "Color already exists" });
    return;
  }

  const color = await Color.create({
    name,
    code,
  });

  if (color) {
    res.status(201).json({
      id: color._id,
      name: color.name,
      code: color.code,
    });
  } else {
    res.status(400).json({ message: "Invalid color data" });
  }
});

const updateColor = asyncHandler(async (req, res) => {
  const { name, code } = req.body;

  const color = await Color.findById(req.params.id);

  if (!color) {
    res.status(404).json({ message: "Color not found" });
    return;
  }

  color.name = name || color.name;
  color.code = code || color.code;

  const updatedColor = await color.save();

  res.status(200).json({
    id: updatedColor._id,
    name: updatedColor.name,
    code: updatedColor.code,
  });
});

const deleteColor = asyncHandler(async (req, res) => {
  const color = await Color.findById(req.params.id);

  if (!color) {
    res.status(404).json({ message: "Color not found" });
    return;
  }

  await color.remove();

  res.status(200).json({ message: "Color removed successfully" });
});

const getColors = asyncHandler(async (req, res) => {
  const colors = await Color.find();

  res.status(200).json(colors);
});

const getColorById = asyncHandler(async (req, res) => {
  const color = await Color.findById(req.params.id);

  if (!color) {
    res.status(404).json({ message: "Color not found" });
    return;
  }

  res.status(200).json(color);
});

const getColorsByIds = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || ids.length === 0) {
    res.status(400).json({ message: "No IDs provided" });
    return;
  }

  const colors = await Color.find({ _id: { $in: ids } });

  if (colors.length === 0) {
    res.status(404).json({ message: "No colors found for the provided IDs" });
    return;
  }

  res.status(200).json(colors);
});

export {
  createColor,
  updateColor,
  getColors,
  getColorById,
  deleteColor,
  getColorsByIds,
};
