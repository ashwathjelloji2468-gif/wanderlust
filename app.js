if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

console.log("ATLASDB_URL =", process.env.ATLASDB_URL);

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync");
const ExpressError = require("./utils/ExpressError");

const listingsRouter = require("./routes/listings");
const reviewsRouter = require("./routes/review");
const userRouter = require("./routes/user");

const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");

const dbUrl = process.env.ATLASDB_URL;

async function main() {
  try {
    await mongoose.connect(dbUrl);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

main();

const sessionOptions = {
  secret: process.env.SESSION_SECRET || "supersupersecret123!@#$",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    sameSite: "lax",
  },
};

// View engine
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Session and auth
app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Locals middleware
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  res.locals.searchValue = req.query.search || "";
  next();
});

// Home route
app.get(
  "/",
  wrapAsync(async (req, res) => {
    res.render("home");
  })
);

// Debug test route
app.get("/test-error", (req, res) => {
  throw new Error("Test error is working");
});

// Routes
app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", userRouter);

// 404 handler
app.use((req, res, next) => {
  console.log("404 - Page not found:", req.method, req.originalUrl);
  next(new ExpressError(404, "Page Not Found!"));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("==============================================");
  console.error("ERROR TIME:", new Date().toISOString());
  console.error("ERROR ROUTE:", req.method, req.originalUrl);
  console.error("ERROR MESSAGE:", err.message);
  console.error("ERROR NAME:", err.name);
  console.error("ERROR CODE:", err.code);
  console.error("ERROR STATUS:", err.status || err.statusCode);
  console.error("REQ.BODY:", req.body);
  console.error("REQ.FILE:", req.file);
  console.error("REQ.USER:", req.user);
  console.error("MAP_TOKEN EXISTS:", !!process.env.MAP_TOKEN);
  console.error("FULL STACK TRACE:");
  console.error(err.stack);
  console.error("==============================================");

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Something Went Wrong";

  if (err.name === "ValidationError") {
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    statusCode = 400;
  } else if (err.name === "CastError") {
    message = "Invalid ID!";
    statusCode = 400;
  }

  res.status(statusCode).render("error", {
    err,
    message,
    statusCode,
  });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});