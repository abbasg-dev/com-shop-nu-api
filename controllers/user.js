import asyncHandler from "express-async-handler";
import formidable from "formidable";
import bcrypt from "bcryptjs";
import User from "../models/user.js";
import cloudinary from "../config/cloudinary.js";

const create = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const form = formidable({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: "Failed to upload user." });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(404).json({ error: "User already exists." });
    }

    try {
      const createdUser = await handleUserForm(fields, files);
      res.status(201).json({
        message: "User created successfully!",
        user: createdUser,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const form = formidable({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: "Failed to upload user." });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    try {
      const updatedUser = await handleUserForm(fields, files, user);
      res.status(200).json({
        message: "User updated successfully!",
        user: updatedUser,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
});

const handleUserForm = async (fields = {}, files = {}, user = null) => {
  if (!fields || typeof fields !== "object") {
    throw new Error("Invalid fields structure.");
  }

  if (!files || typeof files !== "object") {
    throw new Error("Invalid files structure.");
  }

  const getField = (key) => fields[key]?.[0] || "";

  const rawFields = {
    name: getField("name"),
    email: getField("email"),
    //password: getField("passwordHash"),
    phone: getField("phone"),
    street: getField("street"),
    apartment: getField("apartment"),
    zip: getField("zip"),
    city: getField("city"),
    country: getField("country"),
  };

  const labels = {
    name: "Name",
    email: "Email",
    //password: "Password",
    phone: "Phone",
    street: "Street",
    apartment: "Apartment",
    zip: "Zip Code",
    city: "City",
    country: "Country",
  };

  for (const [key, value] of Object.entries(rawFields)) {
    if (!value) {
      throw new Error(`${labels[key]} is required.`);
    }
  }

  //const passwordHash = bcrypt.hashSync(rawFields.password, 10);

  // Upload user profile image
  let userprofile = user?.userprofile || "";

  const uploadedFile = files["userprofile"]?.[0];
  if (uploadedFile?.filepath) {
    const filePath = uploadedFile.filepath;

    if (user?.userprofile) {
      const publicId = user.userprofile.split("/").pop().split(".")[0];
      await cloudinary.v2.uploader.destroy(`blueseed/users/${publicId}`);
    }

    const result = await cloudinary.v2.uploader.upload(filePath, {
      folder: "blueseed/users",
    });

    userprofile = result.secure_url;
  }

  const userData = {
    name: rawFields.name,
    email: rawFields.email,
    //passwordHash,
    phone: rawFields.phone,
    street: rawFields.street,
    apartment: rawFields.apartment,
    zip: rawFields.zip,
    city: rawFields.city,
    country: rawFields.country,
    userprofile,
  };

  let savedUser;
  if (user) {
    userData._id = user._id;
    savedUser = await User.findByIdAndUpdate(user._id, userData, { new: true });
  } else {
    savedUser = new User(userData);
    await savedUser.save();
  }

  return {
    __id: savedUser._id,
    ...userData,
  };
};

const list = asyncHandler(async (req, res) => {
  const userList = await User.find().select("-passwordHash");

  if (!userList) {
    res.status(500).json({ success: false });
  }
  res.send(userList);
});

const userById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(
    "-passwordHash -isAdmin -otp"
  );

  if (!user) {
    res
      .status(500)
      .json({ error: "The user with the given ID was not found." });
  }
  res.status(200).send(user);
});

const countUsers = asyncHandler(async (req, res) => {
  const userCount = await User.countDocuments();
  if (!userCount) {
    res.status(500).json({ success: false });
  }
  res.send({
    userCount: userCount,
  });
});

const remove = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    await user.remove();
    res.json({
      message: "User removed",
      success: true,
    });
  } else {
    res.status(404).json({
      message: "User not Found",
      success: false,
    });
  }
});

export { create, list, userById, updateUser, countUsers, remove };
