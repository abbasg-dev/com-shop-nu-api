import asyncHandler from "express-async-handler";
import expressJwt from "express-jwt"; // for authorization check

const isRevoked = asyncHandler(async (req, payload, done) => {
  if (!payload.isAdmin) {
    done(null, true);
  }
  done();
});

const requireSignin = () => {
  const api = process.env.API_URL;
  // ensure that user info is always available to those routes that require it
  return expressJwt({
    secret: process.env.JWT_SECRET,
    algorithms: ["HS256"],
    userProperty: "auth",
    isRevoked: isRevoked, // a function to verify if a token is revoked
  }).unless({
    path: [
      { url: /\/api\/v1\/products(.*)/, methods: ["GET", "OPTIONS"] },
      {
        url: /\/api\/v1\/categories(.*)/,
        methods: ["GET", "OPTIONS", "POST", "PUT"],
      },
      { url: /\/public\/uploads(.*)/, methods: ["GET", "OPTIONS"] },
      { url: /\/api\/v1\/orders(.*)/, methods: ["GET", "OPTIONS", "POST"] },
      {
        url: /\/api\/v1\/users(.*)/,
        methods: ["GET", "OPTIONS", "POST", "PUT"],
      },
      `${api}/auth/signin`,
      `${api}/auth/google-login`,
      `${api}/auth/facebook-login`,
      `${api}/auth/signup`,
      `${api}/auth/generate-otp`,
      `${api}/auth/verify-recaptcha`,
      `${api}/auth/account-activation`,
      `${api}/auth/forgot-password`,
      `${api}/auth/reset-password`,
      // { url: /(.*)/}
    ],
  });
};

export { requireSignin };
