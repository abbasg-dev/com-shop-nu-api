import asyncHandler from "express-async-handler";
import Ram from "../models/ram.js";

const createRam = asyncHandler(async (req, res) => {
  const { name } = req.body;

  // Check if ram already exists
  const ramExists = await Ram.findOne({ name });

  if (ramExists) {
    res.status(400).json({ message: "Ram already exists" });
    return;
  }

  const ram = await Ram.create({
    name,
  });

  if (ram) {
    res.status(201).json({
      id: ram._id,
      name: ram.name,
    });
  } else {
    res.status(400).json({ message: "Invalid ram data" });
  }
});

const updateRam = asyncHandler(async (req, res) => {
  const { name } = req.body;

  const ram = await Ram.findById(req.params.id);

  if (!ram) {
    res.status(404).json({ message: "Ram not found" });
    return;
  }

  ram.name = name || ram.name;

  const updatedRam = await ram.save();

  res.status(200).json({
    id: updatedRam._id,
    name: updatedRam.name,
  });
});

const deleteRam = asyncHandler(async (req, res) => {
  const ram = await Ram.findById(req.params.id);

  if (!ram) {
    res.status(404).json({ message: "Ram not found" });
    return;
  }

  await ram.remove();

  res.status(200).json({ message: "Ram removed successfully" });
});

const getRams = asyncHandler(async (req, res) => {
  const rams = await Ram.find();

  res.status(200).json(rams);
});

const getRamById = asyncHandler(async (req, res) => {
  const ram = await Ram.findById(req.params.id);

  if (!ram) {
    res.status(404).json({ message: "Ram not found" });
    return;
  }

  res.status(200).json(ram);
});

const getRamsByIds = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || ids.length === 0) {
    res.status(400).json({ message: "No IDs provided" });
    return;
  }

  const rams = await Ram.find({ _id: { $in: ids } });

  if (rams.length === 0) {
    res.status(404).json({ message: "No RAMs found for the provided IDs" });
    return;
  }

  res.status(200).json(rams);
});

export { createRam, updateRam, getRams, getRamById, deleteRam, getRamsByIds };
