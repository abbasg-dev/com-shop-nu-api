import asyncHandler from "express-async-handler";
import formidable from "formidable";
import Brand from "../models/brand.js";
import cloudinary from "../config/cloudinary.js";

const createBrand = asyncHandler(async (req, res) => {
  const form = formidable({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: "Failed to upload brand." });
    }

    try {
      const createdBrand = await handleBrandForm(fields, files);
      res.status(201).json({
        message: "Brand created successfully!",
        brand: createdBrand,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
});

const updateBrand = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const form = formidable({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: "Failed to upload brand." });
    }

    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(404).json({ error: "Brand not found." });
    }

    try {
      const updatedBrand = await handleBrandForm(fields, files, brand);
      res.status(200).json({
        message: "Brand updated successfully!",
        brand: updatedBrand,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
});

const handleBrandForm = async (fields = {}, files = {}, brand = null) => {
  if (!fields || typeof fields !== "object") {
    throw new Error("Invalid fields structure.");
  }

  if (!files || typeof files !== "object") {
    throw new Error("Invalid files structure.");
  }

  const brandName = fields["name"]?.[0] || "";
  const isActive = fields["isActive"]
    ? fields["isActive"][0] === "true"
    : false;
  let brandicon = "";

  if (files["brandicon"] && files["brandicon"][0]) {
    const filePath = files["brandicon"][0].filepath;

    if (brand && brand.brandicon) {
      const publicId = brand.brandicon.split("/").pop().split(".")[0];
      await cloudinary.v2.uploader.destroy(`blueseed/brands/${publicId}`);
    }

    const result = await cloudinary.v2.uploader.upload(filePath, {
      folder: "blueseed/brands",
    });

    brandicon = result.secure_url;
  } else if (brand) {
    brandicon = brand.brandicon || "";
  }

  if (!brandName) {
    throw new Error("Brand name is required.");
  }

  const brandData = {
    name: brandName,
    isActive,
    brandicon,
  };

  let savedBrand;
  if (brand) {
    brandData._id = brand._id;
    savedBrand = await Brand.findByIdAndUpdate(brand._id, brandData, {
      new: true,
    });
  } else {
    savedBrand = new Brand(brandData);
    await savedBrand.save();
  }

  return {
    __id: savedBrand._id,
    ...brandData,
  };
};

const getBrands = asyncHandler(async (req, res) => {
  const brandsList = await Brand.find({});

  if (!brandsList) {
    res.status(500).json({ success: false });
  }
  res.send(brandsList);
});

const getBrandById = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    return res.status(404).json({ message: "Brand not found" });
  }

  res.json(brand);
});

const deleteBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) {
    return res.status(404).json({ error: "Brand not found" });
  }

  const publicId = brand.brandicon.split("/").pop().split(".")[0];

  try {
    await cloudinary.v2.uploader.destroy(`blueseed/brands/${publicId}`);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to delete image from Cloudinary" });
  }

  await brand.deleteOne();
  res.json({ message: "Brand deleted successfully" });
});

export { createBrand, getBrands, getBrandById, updateBrand, deleteBrand };
