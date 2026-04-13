 require("dotenv").config();
const mongoose = require("mongoose");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const Listing = require("./models/listing");

const mapToken = process.env.MAP_TOKEN;
const dbUrl = process.env.ATLASDB_URL;

const geocodingClient = mbxGeocoding({
  accessToken: mapToken,
});

async function migrateListings() {
  try {
    await mongoose.connect(dbUrl);
    console.log("Connected to MongoDB");

    const listings = await Listing.find({});
    console.log(`Found ${listings.length} listings`);

    for (let listing of listings) {
      const alreadyHasCoords =
        listing.geometry &&
        Array.isArray(listing.geometry.coordinates) &&
        listing.geometry.coordinates.length === 2;

      if (alreadyHasCoords) {
        console.log(`Skipping: ${listing.title} (already has geometry)`);
        continue;
      }

      const fullLocation = `${listing.location || ""}, ${listing.country || ""}`.trim();

      if (!fullLocation || fullLocation === ",") {
        console.log(`Skipping: ${listing.title} (missing location/country)`);
        continue;
      }

      try {
        const response = await geocodingClient
          .forwardGeocode({
            query: fullLocation,
            limit: 1,
          })
          .send();

        const geometry = response.body.features[0]?.geometry;

        if (!geometry) {
          console.log(`No coordinates found for: ${listing.title} -> ${fullLocation}`);
          continue;
        }

        listing.geometry = geometry;
        await listing.save();

        console.log(`Updated: ${listing.title} -> ${geometry.coordinates}`);
      } catch (err) {
        console.log(`Failed for: ${listing.title}`);
        console.log(err.message);
      }
    }

    console.log("Migration completed");
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

migrateListings();