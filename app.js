if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
require("dotenv").config({ path: "./.env" });

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
    await mongoose.connect(process.env.ATLASDB_URL);
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

// EJS Engine
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Session & Auth
app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Flash middleware
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  res.locals.searchValue = req.query.search || "";
  next();
});

// Routes
app.get(
  "/",
  wrapAsync(async (req, res) => {
    res.render("home");
  }),
);

app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", userRouter);

// Error handlers
app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something Went Wrong" } = err;

  if (err.name === "ValidationError") {
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  } else if (err.name === "CastError") {
    message = "Invalid ID!";
    statusCode = 400;
  }

  console.error("Error:", err);
  res.status(statusCode).render("error", { err, message });
});

// Start server
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});