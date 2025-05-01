import asyncHandler from "express-async-handler";
import formidable from "formidable";
import cloudinary from "cloudinary";
import sharp from "sharp";
import Product from "../models/product.js";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to calculate price after discount
const calculatePriceAfterDiscount = (originalPrice, discount) => {
  return originalPrice - (originalPrice * discount) / 100;
};

// Function to handle both main image and additional images
const handleImages = async (
  fields,
  files,
  productName,
  existingProduct = null
) => {
  let productImage = null;
  const uploadedImages = [];

  if (files["image"] && files["image"][0]) {
    const filePath = files["image"][0].filepath;

    if (existingProduct && existingProduct.image) {
      const publicId = existingProduct.image.split("/").pop().split(".")[0];
      await cloudinary.v2.uploader.destroy(
        `blueseed/products/${productName}/${publicId}`
      );
    }

    const result = await cloudinary.v2.uploader.upload(filePath, {
      folder: `blueseed/products/${productName}`,
    });

    productImage = result.secure_url;
  } else if (existingProduct) {
    productImage = existingProduct.image || "";
  }

  if (existingProduct?.images?.length > 0) {
    for (const oldImage of existingProduct.images) {
      try {
        const deleteResponse = await cloudinary.v2.uploader.destroy(
          oldImage.publicId
        );
        console.log("Deleted additional image response:", deleteResponse);
      } catch (error) {
        console.error("Error deleting additional image:", error);
      }
    }
  }

  // Handle dataURLs: Process them separately to avoid pushing twice
  const imageDataURLs = fields.imageDataURLs || [];
  for (const dataURL of imageDataURLs) {
    if (dataURL) {
      // Upload the dataURL to Cloudinary
      const dataResult = await cloudinary.v2.uploader.upload(dataURL, {
        folder: `blueseed/products/${productName}/gallery/`,
      });

      // Push the uploaded image data with dataURL into uploadedImages
      uploadedImages.push({
        url: dataResult.secure_url,
        publicId: dataResult.public_id,
        dataURL: dataURL, // Store the actual dataURL
      });
    }
  }

  // Handle file uploads only if they have a corresponding dataURL
  const imageFiles = files["images"];
  if (Array.isArray(imageFiles)) {
    for (const imageFile of imageFiles) {
      // Check if this image already exists in the dataURLs to avoid duplicate upload
      const isImageFromDataURL = imageDataURLs.some(
        (dataURL) => dataURL === imageFile.filepath
      );

      // Only upload if there's a matching dataURL
      if (isImageFromDataURL) {
        const result = await cloudinary.v2.uploader.upload(imageFile.filepath, {
          folder: `blueseed/products/${productName}/gallery/`,
        });

        // Push the uploaded file data into uploadedImages only if it's from dataURL
        uploadedImages.push({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    }
  } else if (imageFiles) {
    const result = await cloudinary.v2.uploader.upload(imageFiles.filepath, {
      folder: `blueseed/products/${productName}/gallery/`,
    });

    // Push the uploaded file data into uploadedImages only if it's from dataURL
    uploadedImages.push({
      url: result.secure_url,
      publicId: result.public_id,
    });
  }

  return { productImage, uploadedImages };
};

// Updated create function
const create = asyncHandler(async (req, res) => {
  const form = formidable({
    keepExtensions: true,
    multiples: true,
    allowEmptyFiles: false,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: "Failed to upload product" });
    }

    try {
      // Check if the product already exists
      const existingProduct = await Product.findOne({ name: fields.name[0] });
      if (existingProduct) {
        return res.status(400).json({ error: "Product already exists" });
      }

      // Handle images
      const { productImage, uploadedImages } = await handleImages(
        fields,
        files,
        fields.name[0]
      );

      // Prepare product data
      const createdProduct = await handleProductForm(
        fields,
        uploadedImages,
        productImage
      );

      res.status(201).json({
        message: "Product created successfully!",
        product: createdProduct,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
});

// Updated update function
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const form = formidable({
    keepExtensions: true,
    multiples: true,
    allowEmptyFiles: false,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: "Failed to upload product" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    try {
      // Handle images, passing the existing product to delete old images
      const { productImage, uploadedImages } = await handleImages(
        fields,
        files,
        product.name,
        product
      );

      // Prepare product data
      const updatedProduct = await handleProductForm(
        fields,
        uploadedImages,
        productImage,
        product // Pass the existing product for updates
      );

      res.status(200).json({
        message: "Product updated successfully!",
        product: updatedProduct,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
});

const handleProductForm = async (
  fields = {},
  uploadedImages = [],
  productImage = "",
  product = null
) => {
  // Prepare product data
  const productData = {
    name: fields.name[0],
    description: fields.description[0],
    richDescription: fields.richDescription[0],
    image: productImage, // Use the main image passed from the update/create function
    images: uploadedImages, // Additional images URLs
    brand: fields.brand[0],
    originalPrice: Number(fields.originalPrice[0]),
    discount: Number(fields.discount[0]),
    priceAfterDiscount: calculatePriceAfterDiscount(
      Number(fields.originalPrice[0]),
      Number(fields.discount[0])
    ),
    category: fields.category[0],
    subCategory: fields.subcategory[0],
    childCategory: fields.childCategory[0],
    countInStock: Number(fields.countInStock[0]),
    isFeatured: fields.isFeatured[0] === "true",
    color: fields.color[0].split(","),
    shipping: fields.shipping[0] === "true",
    returnable: fields.returnable[0] === "true",
    returnPeriod: fields.returnPeriod[0],
    shippingInfo: fields.shippingInfo[0],
  };

  // Only add weight, ram, and size if they are provided and valid
  if (fields.weight[0] && fields.weight[0] !== "undefined") {
    productData.weight = fields.weight[0].split(",");
  } else {
    productData.weight = []; // Ensure it's an empty array if undefined or invalid
  }

  if (fields.ram[0] && fields.ram[0] !== "undefined") {
    productData.ram = fields.ram[0].split(",");
  } else {
    productData.ram = []; // Ensure it's an empty array if undefined or invalid
  }

  if (fields.size[0] && fields.size[0] !== "undefined") {
    productData.size = fields.size[0].split(",");
  } else {
    productData.size = []; // Ensure it's an empty array if undefined or invalid
  }

  let savedProduct;
  if (product) {
    productData._id = product._id; // Ensure to include the product ID for updates
    savedProduct = await Product.findByIdAndUpdate(product._id, productData, {
      new: true,
      runValidators: true,
    });
  } else {
    savedProduct = new Product(productData);
    await savedProduct.save();
  }

  return savedProduct; // Return the updated or newly created product
};

const list = asyncHandler(async (req, res) => {
  let filter = {};

  // Filter by category
  if (req.query.categories) {
    filter.category = { $in: req.query.categories.split(",") };
  }

  // Filter by sub-category
  if (req.query.subCategories) {
    filter.subCategory = { $in: req.query.subCategories.split(",") };
  }

  // Filter by child category
  if (req.query.childCategories) {
    filter.childCategory = { $in: req.query.childCategories.split(",") };
  }

  // Filter by color
  if (req.query.color) {
    filter.color = { $in: req.query.color.split(",") };
  }

  // Filter by price range
  if (req.query.minPrice || req.query.maxPrice) {
    filter.originalPrice = {};
    if (req.query.minPrice) {
      filter.originalPrice.$gte = Number(req.query.minPrice);
    }
    if (req.query.maxPrice) {
      filter.originalPrice.$lte = Number(req.query.maxPrice);
    }
  }

  // Query the database for products and populate related fields
  const products = await Product.find(filter)
    .select("-images.dataURL")
    .populate("category") // Populate category
    .populate("subCategory") // Populate subCategory
    .populate("childCategory") // Populate childCategory
    .populate("color") // Populate color
    .exec();

  if (!products || products.length === 0) {
    return res.status(404).json({ error: "No products found" });
  }

  res.json(products);
});

const compressBase64 = async (base64) => {
  const base64Data = base64.split(",")[1];
  const buffer = Buffer.from(base64Data, "base64");

  const compressedBuffer = await sharp(buffer)
    .png({ compressionLevel: 9, quality: 80 })
    .toBuffer();

  return `data:image/png;base64,${compressedBuffer.toString("base64")}`;
};

const productById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate("category")
    .lean();

  if (!product) {
    return res
      .status(404)
      .json({ message: "Product not Found", success: false });
  }

  // Compress all dataURLs in images array
  if (Array.isArray(product?.images)) {
    const compressions = await Promise.all(
      product?.images?.map(async (img) => {
        if (img?.dataURL?.startsWith("data:image")) {
          try {
            return { ...img, dataURL: await compressBase64(img.dataURL) };
          } catch (err) {
            console.error("Image compression failed:", err.message);
          }
        }
        return img;
      })
    );
    product.images = compressions;
  }

  res.json(product);
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const folderPath = `blueseed/products/${product.name}`;

    // 1. Delete main image (if exists)
    if (product.image) {
      try {
        const publicId = product.image.split("/").pop().split(".")[0];
        await cloudinary.v2.uploader.destroy(`${folderPath}/${publicId}`);
        console.log("Main image deleted");
      } catch (err) {
        console.error("Failed to delete main image:", err.message);
      }
    }

    // 2. Delete gallery images
    if (Array.isArray(product.images) && product.images.length > 0) {
      for (const img of product.images) {
        try {
          await cloudinary.v2.uploader.destroy(img.publicId);
          console.log(`Deleted gallery image: ${img.publicId}`);
        } catch (err) {
          console.error("Failed to delete gallery image:", err.message);
        }
      }
    }

    // 3. Delete the product folder from Cloudinary
    try {
      // Safety: clear any leftover assets by prefix (optional)
      await cloudinary.v2.api.delete_resources_by_prefix(folderPath);

      // Then remove the folder
      await cloudinary.v2.api.delete_folder(folderPath);
      console.log(`Deleted Cloudinary folder: ${folderPath}`);
    } catch (folderErr) {
      console.error("Failed to delete folder:", folderErr.message);
    }

    // 4. Delete the product from MongoDB
    await Product.findByIdAndDelete(id);

    res
      .status(200)
      .json({ message: "Product, images, and folder deleted successfully!" });
  } catch (error) {
    console.error("Delete error:", error.message);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

const countProducts = asyncHandler(async (req, res) => {
  const productCount = await Product.countDocuments();
  if (!productCount) {
    return res.status(500).json({ success: false });
  }
  res.send({ productCount });
});

const countFeaturedProducts = asyncHandler(async (req, res) => {
  const count = req.params.count ? parseInt(req.params.count) : 0;
  const products = await Product.find({ isFeatured: true })
    .select("-images.dataURL")
    .limit(count)
    .exec();

  if (!products) {
    return res.status(500).json({ success: false });
  }
  res.send(products);
});

const countFeaturedByCategory = asyncHandler(async (req, res) => {
  const count = req.params.count ? req.params.count : 0;
  const { categories } = req.query;

  let filter = { isFeatured: true };

  if (categories) {
    filter.category = { $in: categories.split(",") };
  }

  try {
    const products = await Product.find(filter)
      .select("-images.dataURL")
      .populate("category")
      .limit(+count)
      .exec();

    if (!products || products.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No products found" });
    }

    res.json(products);
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
});

const getHighestPrice = asyncHandler(async (req, res) => {
  const highestProduct = await Product.findOne()
    .sort({ originalPrice: -1 })
    .select("originalPrice");

  if (!highestProduct) {
    res.status(404).json({ message: "No products found" });
    return;
  }

  res.status(200).json({ highestPrice: highestProduct.originalPrice });
});

export {
  create,
  updateProduct,
  list,
  productById,
  deleteProduct,
  countProducts,
  countFeaturedProducts,
  countFeaturedByCategory,
  getHighestPrice,
};
