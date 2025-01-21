import express from "express";
const router = express.Router();

import {
  signin,
  signup,
  googleLogin,
  facebookLogin,
  generateOtp,
  verifyRecaptcha,
  accountActivation,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.js";

router.post("/signin", signin);
router.post("/signup", signup);
router.post("/google-login", googleLogin);
router.post("/facebook-login", facebookLogin);
router.post("/generate-otp", generateOtp);
router.post("/verify-recaptcha", verifyRecaptcha);
router.post("/account-activation", accountActivation);
router.put("/forgot-password", forgotPassword);
router.put("/reset-password", resetPassword);

export default router;
