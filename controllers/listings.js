const Listing = require("../models/listing");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");

const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports.index = async (req, res, next) => {
  try {
    const { search = "", category = "" } = req.query;
    let filter = {};

    console.log("=== INDEX ROUTE ===");
    console.log("Query Params:", req.query);

    if (search.trim()) {
      const safeSearch = escapeRegex(search.trim());
      const regex = new RegExp(safeSearch, "i");
      filter.$or = [
        { title: regex },
        { location: regex },
        { country: regex },
        { description: regex },
      ];
    }

    if (category.trim() && category !== "All") {
      filter.category = category.trim();
    }

    console.log("Applied Filter:", filter);

    const allListings = await Listing.find(filter);

    console.log("Listings Found:", allListings.length);

    res.render("listings/index", {
      allListings: allListings || [],
      selectedCategory: category || "All",
    });
  } catch (err) {
    console.error("INDEX ERROR:");
    console.error(err);
    console.error(err.stack);
    next(err);
  }
};

module.exports.renderNewForm = (req, res) => {
  console.log("=== RENDER NEW FORM ===");
  res.render("listings/new");
};

module.exports.showListing = async (req, res, next) => {
  try {
    console.log("=== SHOW LISTING ===");
    console.log("Listing ID:", req.params.id);

    const listing = await Listing.findById(req.params.id)
      .populate("reviews")
      .populate("owner");

    if (!listing) {
      console.log("Listing not found");
      req.flash("error", "Listing you requested does not exist!");
      return res.redirect("/listings");
    }

    console.log("Listing found:", listing.title);
    console.log("Geometry:", listing.geometry);

    res.render("listings/show", {
      listing,
      mapToken: process.env.MAP_TOKEN,
    });
  } catch (err) {
    console.error("SHOW LISTING ERROR:");
    console.error(err);
    console.error(err.stack);
    next(err);
  }
};

module.exports.createListing = async (req, res, next) => {
  try {
    console.log("=== CREATE LISTING START ===");
    console.log("req.body:", req.body);
    console.log("req.file:", req.file);
    console.log("req.user:", req.user);

    if (!req.body.listing) {
      req.flash("error", "No listing data received.");
      return res.redirect("/listings/new");
    }

    const { title, description, location, country, price, category } = req.body.listing;

    if (
      !title?.trim() ||
      !description?.trim() ||
      !location?.trim() ||
      !country?.trim() ||
      !price ||
      !category?.trim()
    ) {
      req.flash("error", "Please fill in all required fields.");
      return res.redirect("/listings/new");
    }

    if (!req.user) {
      req.flash("error", "You must be logged in.");
      return res.redirect("/login");
    }

    const fullLocation = `${location.trim()}, ${country.trim()}`;

    const geoResponse = await geocodingClient
      .forwardGeocode({
        query: fullLocation,
        limit: 1,
      })
      .send();

    const geometry = geoResponse.body.features[0]?.geometry;

    if (!geometry) {
      req.flash("error", "Could not find coordinates for this location.");
      return res.redirect("/listings/new");
    }

    const newListing = new Listing({
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      country: country.trim(),
      price: Number(price),
      category: category.trim(),
      owner: req.user._id,
      geometry: geometry,
    });

    if (req.file) {
      newListing.image = {
        url: req.file.path,
        filename: req.file.filename,
      };
    } else {
      newListing.image = {
        url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800",
        filename: "defaultimage",
      };
    }

    await newListing.save();

    console.log("LISTING SAVED:", newListing._id);
    console.log("Saved geometry:", newListing.geometry);
    console.log("=== CREATE LISTING END ===");

    req.flash("success", "New listing created successfully!");
    res.redirect(`/listings/${newListing._id}`);
  } catch (err) {
    console.error("=== CREATE LISTING ERROR ===");
    console.error("Message:", err.message);
    console.error("Full error:", err);
    console.error("Stack:", err.stack);
    if (err.errors) console.error("Validation errors:", err.errors);
    req.flash("error", err.message || "Something went wrong");
    res.redirect("/listings/new");
  }
};

module.exports.renderEditForm = async (req, res, next) => {
  try {
    console.log("=== RENDER EDIT FORM ===");
    console.log("Listing ID:", req.params.id);

    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      console.log("Listing not found for edit");
      req.flash("error", "Listing not found!");
      return res.redirect("/listings");
    }

    console.log("Listing found for edit:", listing.title);
    res.render("listings/edit", { listing });
  } catch (err) {
    console.error("RENDER EDIT FORM ERROR:");
    console.error(err);
    console.error(err.stack);
    next(err);
  }
};

module.exports.updateListing = async (req, res, next) => {
  try {
    console.log("=== UPDATE LISTING START ===");
    console.log("Listing ID:", req.params.id);
    console.log("req.body:", req.body);
    console.log("req.file:", req.file);

    if (!req.body.listing) {
      console.log("ERROR: req.body.listing is missing in update");
      req.flash("error", "No listing data received.");
      return res.redirect("/listings");
    }

    const { title, description, location, country, price, category } = req.body.listing;

    const fullLocation = `${location.trim()}, ${country.trim()}`;

    const geoResponse = await geocodingClient
      .forwardGeocode({
        query: fullLocation,
        limit: 1,
      })
      .send();

    const geometry = geoResponse.body.features[0]?.geometry;

    const listingData = {
      title: title?.trim() || "",
      description: description?.trim() || "",
      location: location?.trim() || "",
      country: country?.trim() || "",
      price: Number(price) || 0,
      category: category?.trim() || "Cabins",
      geometry: geometry,
    };

    console.log("Update listingData:", listingData);

    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      listingData,
      { new: true, runValidators: true }
    );

    if (!listing) {
      console.log("ERROR: Listing not found during update");
      req.flash("error", "Listing not found!");
      return res.redirect("/listings");
    }

    if (req.file) {
      console.log("Updating image...");
      listing.image = {
        url: req.file.path,
        filename: req.file.filename,
      };
      await listing.save();
    }

    console.log("SUCCESS: Listing updated");
    console.log("=== UPDATE LISTING END ===");

    req.flash("success", "Listing updated successfully!");
    res.redirect(`/listings/${listing._id}`);
  } catch (err) {
    console.error("=== UPDATE LISTING ERROR ===");
    console.error("Error message:", err.message);
    console.error("Full error:", err);
    console.error("Stack trace:", err.stack);
    if (err.errors) console.error("Validation errors:", err.errors);
    next(err);
  }
};

module.exports.destroyListing = async (req, res, next) => {
  try {
    console.log("=== DELETE LISTING ===");
    console.log("Listing ID:", req.params.id);

    const deletedListing = await Listing.findByIdAndDelete(req.params.id);

    if (!deletedListing) {
      console.log("Listing not found for delete");
      req.flash("error", "Listing not found!");
      return res.redirect("/listings");
    }

    console.log("Deleted listing:", deletedListing.title);

    req.flash("success", "Listing deleted successfully!");
    res.redirect("/listings");
  } catch (err) {
    console.error("DELETE LISTING ERROR:");
    console.error(err);
    console.error(err.stack);
    next(err);
  }
};