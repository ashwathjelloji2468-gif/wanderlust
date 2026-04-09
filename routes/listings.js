const express = require("express");
const router = express.Router();
const multer = require("multer");
const { storage } = require("../cloudConfig");
const upload = multer({ storage });

const wrapAsync = require("../utils/wrapAsync");
const listingController = require("../controllers/listings");
const { isLoggedIn } = require("../middleware");

// INDEX & CREATE
router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    upload.single("listing[image]"),   // ✅ FIXED
    wrapAsync(listingController.createListing)
  );

// NEW FORM
router.get("/new", isLoggedIn, listingController.renderNewForm);

// SHOW
router.get("/:id", wrapAsync(listingController.showListing));

// EDIT FORM
router.get(
  "/:id/edit",
  isLoggedIn,
  wrapAsync(listingController.renderEditForm)
);

// UPDATE
router.put(
  "/:id",
  isLoggedIn,
  upload.single("listing[image]"),   // ✅ FIXED HERE ALSO
  wrapAsync(listingController.updateListing)
);

// DELETE
router.delete(
  "/:id",
  isLoggedIn,
  wrapAsync(listingController.destroyListing)
);

module.exports = router;