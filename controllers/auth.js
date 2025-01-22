import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { OAuth2Client } from "google-auth-library";
import fetch from "node-fetch";
import otpGenerator from "otp-generator";
import nodemailer from "nodemailer";

const client = new OAuth2Client(process.env.GOOGLE_OAUTH_CLIENT_ID);

const transporter = nodemailer.createTransport({
  service: "gmail", // You can use other email services (e.g., Outlook, Yahoo)
  auth: {
    user: process.env.EMAIL_FROM, // Your email address
    pass: process.env.EMAIL_PASSWORD, // Your email app password
  },
});

const signin = asyncHandler(async (req, res) => {
  const { email, password, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (!bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  if (!otp) {
    return res.status(400).json({ error: "OTP is required" });
  }

  // Check if OTP is expired or invalid
  if (user.otp && user.otp.code) {
    if (user.otp.code !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }
    if (user.otp.expiresAt < Date.now()) {
      return res
        .status(400)
        .json({ error: "OTP has expired. Please request a new one." });
    }

    // Clear OTP after successful verification
    user.otp = {};
    await user.save();
  }

  // Generate JWT token
  const token = jwt.sign(
    {
      userId: user.id,
      isAdmin: user.isAdmin,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ user, token });
});

const signup = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    passwordHash,
    phone,
    isAdmin,
    street,
    apartment,
    zip,
    city,
    country,
  } = req.body;

  // Check if the user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      error: "Email is already taken",
    });
  }

  // Hash the password
  const hashedPassword = bcrypt.hashSync(passwordHash, 10);

  // Generate account activation token
  const token = jwt.sign(
    {
      name,
      email,
      passwordHash: hashedPassword,
      phone,
      isAdmin,
      street,
      apartment,
      zip,
      city,
      country,
    },
    process.env.JWT_ACCOUNT_ACTIVATION,
    { expiresIn: "10m" }
  );

  // Email data with token and name as query parameters
  const emailData = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Account Activation Link",
    html: `
            <h1>Hello ${name},</h1>
            <p>Please use the following link to activate your account:</p>
            <p>
              <a href="${process.env.CLIENT_URL}/auth/activate/${token}">
                Activate
              </a>
            </p>
            <hr />
            <p>This email may contain sensitive information</p>
        `,
  };

  // Send activation email
  try {
    await transporter.sendMail(emailData); // Use the transporter instance
    return res.status(200).json({
      message: `Email has been sent to ${email}. Follow the instructions to activate your account.`,
    });
  } catch (error) {
    console.error("Error sending activation email:", error);
    return res.status(500).json({
      error:
        "There was an error sending the activation email. Please try again later.",
    });
  }
});

const googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  client
    .verifyIdToken({
      idToken,
      requiredAudience: process.env.GOOGLE_OAUTH_CLIENT_ID,
    })
    .then((response) => {
      // console.log('GOOGLE LOGIN RESPONSE', response)
      const { email_verified, name, email } = response.payload;
      if (email_verified) {
        User.findOne({ email }).exec((err, user) => {
          if (user) {
            // generate a token and send to client
            const token = jwt.sign(
              {
                userId: user.id,
                isAdmin: user.isAdmin,
              },
              process.env.JWT_SECRET,
              { expiresIn: "7d" }
            );
            return res.json({
              token,
              user: user,
            });
          } else {
            let passwordHash = bcrypt.hashSync(
              email + process.env.JWT_SECRET,
              10
            );
            user = new User({ name, email, passwordHash });
            user.save((err, data) => {
              if (err) {
                // console.log('ERROR GOOGLE LOGIN ON USER SAVE', err)
                return res.status(400).json({
                  error: "User signup failed with google",
                });
              }
              const token = jwt.sign(
                {
                  userId: data.userId,
                  isAdmin: data.isAdmin,
                },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
              );
              return res.json({
                token,
                user: data,
              });
            });
          }
        });
      } else {
        return res.status(400).json({
          error: "Google login failed. Try again!",
        });
      }
    });
});

const facebookLogin = asyncHandler(async (req, res) => {
  // console.log('FACEBOOK LOGIN REQ BODY', req.body);
  const { id, authToken } = req.body;
  const url = `https://graph.facebook.com/v2.11/${id}/?fields=id, name, email&access_token=${authToken}`;
  return (
    fetch(url, {
      method: "GET",
    })
      .then((response) => response.json())
      // .then(response => console.log(response))
      .then((response) => {
        const { email, name } = response;
        User.findOne({ email }).exec((err, user) => {
          if (user) {
            const token = jwt.sign(
              {
                userId: user.id,
                isAdmin: user.isAdmin,
              },
              process.env.JWT_SECRET,
              { expiresIn: "7d" }
            );
            return res.json({
              token,
              user: user,
            });
          } else {
            let passwordHash = bcrypt.hashSync(
              email + process.env.JWT_SECRET,
              10
            );
            user = new User({ name, email, passwordHash });
            user.save((err, data) => {
              if (err) {
                // console.log('ERROR FACEBOOK LOGIN ON USER SAVE', err)
                return res.status(400).json({
                  error: "User signup failed with facebook",
                });
              }
              const token = jwt.sign(
                {
                  userId: data.userId,
                  isAdmin: data.isAdmin,
                },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
              );
              return res.json({
                token,
                user: data,
              });
            });
          }
        });
      })
      .catch(() => {
        res.json({
          error: "Facebook login failed. Try later",
        });
      })
  );
});

const generateOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Check if the user exists
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Check if OTP is already generated and not expired
  if (user.otp && user.otp.expiresAt > Date.now()) {
    return res.status(400).json({
      error: `You can request a new OTP after the current one expires in ${Math.ceil(
        (user.otp.expiresAt - Date.now()) / 1000 / 60
      )} minutes.`,
    });
  }

  // Generate OTP (6 digits only)
  const otp = otpGenerator.generate(6, {
    digits: true, // Only digits (no letters or special characters)
    lowerCaseAlphabets: false, // No lowercase letters
    upperCaseAlphabets: false, // No uppercase letters
    specialChars: false, // No special characters
  });

  // Set OTP and expiration time
  user.otp = {
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // Expires in 10 minutes
  };

  await user.save();

  // Email data with OTP included
  const emailData = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Your OTP Code",
    html: `
      <h1>OTP for Your Account</h1>
      <p>Your OTP code is: <strong>${otp}</strong></p>
      <p>This OTP will expire in 10 minutes.</p>
      <hr />
      <p>If you did not request this OTP, please ignore this email.</p>
    `,
  };

  // Send OTP email
  try {
    await transporter.sendMail(emailData);
    res.status(200).json({ message: "OTP sent successfully to your email." });
  } catch (error) {
    return res.status(500).json({
      error:
        "There was an error sending the OTP email. Please try again later.",
    });
  }
});

const verifyRecaptcha = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "No reCAPTCHA token provided" });
  }

  const secretKey = process.env.GOOGLE_RECAPTCHA_SECRET;

  try {
    // Verify reCAPTCHA token with Google
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`,
      { method: "POST" }
    );

    const data = await response.json();

    if (!data.success) {
      return res.status(400).json({
        error: "Invalid reCAPTCHA token",
        errorCodes: data["error-codes"] || [],
      });
    }

    res.status(200).json({ message: "reCAPTCHA verified successfully" });
  } catch (error) {
    console.error("reCAPTCHA verification failed:", error.message);
    res.status(500).json({
      error: "Internal server error while verifying reCAPTCHA",
    });
  }
});

const accountActivation = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      message: "Invalid token. Please try again.",
    });
  }

  jwt.verify(
    token,
    process.env.JWT_ACCOUNT_ACTIVATION,
    async (err, decoded) => {
      if (err) {
        return res.status(401).json({
          error: "Expired link. Please sign up again.",
        });
      }

      const {
        name,
        email,
        passwordHash,
        phone,
        isAdmin,
        street,
        apartment,
        zip,
        city,
        country,
      } = decoded;

      try {
        const newUser = new User({
          name,
          email,
          passwordHash, // This is already hashed
          phone,
          isAdmin,
          street,
          apartment,
          zip,
          city,
          country,
        });

        await newUser.save();
        return res.status(200).json({
          message: "Signup success! Please log in to your account.",
        });
      } catch (saveError) {
        return res.status(500).json({
          error: "There was an error saving your account. Please try again.",
        });
      }
    }
  );
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res
      .status(400)
      .json({ error: "User with this email does not exist." });
  }

  const token = jwt.sign({ _id: user._id }, process.env.JWT_RESET_PASSWORD, {
    expiresIn: "10m",
  });

  const emailData = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Password Reset Link",
    html: `
          <h1>Reset your password</h1>
          <p>Click the link below to reset your password:</p>
          <p>
            <a href="${process.env.CLIENT_URL}/auth/reset-password/${token}">
              Reset password
            </a>
          </p>
      `,
  };

  user.resetPasswordLink = token;
  await user.save();

  try {
    await transporter.sendMail(emailData); // Send the email with nodemailer
    res.json({
      message: `Email sent to ${email}. Follow the instructions to reset your password.`,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to send email. Try again later." });
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { resetPasswordLink, newPassword } = req.body;

  if (resetPasswordLink) {
    try {
      jwt.verify(resetPasswordLink, process.env.JWT_RESET_PASSWORD);

      const user = await User.findOne({ resetPasswordLink });
      if (!user) {
        return res
          .status(400)
          .json({ error: "Invalid or expired reset link." });
      }

      user.passwordHash = bcrypt.hashSync(newPassword, 10);
      user.resetPasswordLink = "";
      await user.save();

      res.json({
        message:
          "Password reset successful. Please log in with your new password.",
      });
    } catch (err) {
      res.status(400).json({ error: "Invalid or expired reset link." });
    }
  } else {
    res.status(400).json({ error: "Missing reset token." });
  }
});

export {
  signin,
  signup,
  googleLogin,
  facebookLogin,
  generateOtp,
  verifyRecaptcha,
  accountActivation,
  forgotPassword,
  resetPassword,
};
