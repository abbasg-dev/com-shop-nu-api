import asyncHandler from "express-async-handler";
import Size from "../models/size.js";

const createSize = asyncHandler(async (req, res) => {
  const { name } = req.body;

  // Check if size already exists
  const sizeExists = await Size.findOne({ name });

  if (sizeExists) {
    res.status(400).json({ message: "Size already exists" });
    return;
  }

  const size = await Size.create({
    name,
  });

  if (size) {
    res.status(201).json({
      id: size._id,
      name: size.name,
    });
  } else {
    res.status(400).json({ message: "Invalid size data" });
  }
});

const updateSize = asyncHandler(async (req, res) => {
  const { name } = req.body;

  const size = await Size.findById(req.params.id);

  if (!size) {
    res.status(404).json({ message: "Size not found" });
    return;
  }

  size.name = name || size.name;

  const updatedSize = await size.save();

  res.status(200).json({
    id: updatedSize._id,
    name: updatedSize.name,
  });
});

const deleteSize = asyncHandler(async (req, res) => {
  const size = await Size.findById(req.params.id);

  if (!size) {
    res.status(404).json({ message: "Size not found" });
    return;
  }

  await size.remove();

  res.status(200).json({ message: "Size removed successfully" });
});

const getSizes = asyncHandler(async (req, res) => {
  const sizes = await Size.find();

  res.status(200).json(sizes);
});

const getSizeById = asyncHandler(async (req, res) => {
  const size = await Size.findById(req.params.id);

  if (!size) {
    res.status(404).json({ message: "Size not found" });
    return;
  }

  res.status(200).json(size);
});

const getSizesByIds = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || ids.length === 0) {
    res.status(400).json({ message: "No IDs provided" });
    return;
  }

  const sizes = await Size.find({ _id: { $in: ids } });

  if (sizes.length === 0) {
    res.status(404).json({ message: "No sizes found for the provided IDs" });
    return;
  }

  res.status(200).json(sizes);
});

export {
  createSize,
  updateSize,
  getSizes,
  getSizeById,
  deleteSize,
  getSizesByIds,
};
