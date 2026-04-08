 const mongoose = require("mongoose");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const Listing = require("../models/listing");

require("dotenv").config();

const dbUrl = "mongodb://127.0.0.1:27017/wanderlust"; 
const mapToken = process.env.MAP_TOKEN;

const geocodingClient = mbxGeocoding({
  accessToken: mapToken,
});

main()
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(dbUrl);
  await updateOldListings();
  await mongoose.connection.close();
}

async function updateOldListings() {
  const listings = await Listing.find({
    $or: [
      { geometry: { $exists: false } },
      { geometry: null },
      { "geometry.coordinates": { $exists: false } },
    ],
  });

  console.log(`Found ${listings.length} listings to update`);

  for (let listing of listings) {
    try {
      if (!listing.location) continue;

      const geoResponse = await geocodingClient
        .forwardGeocode({
          query: listing.location,
          limit: 1,
        })
        .send();

      const feature = geoResponse.body.features[0];

      if (feature) {
        listing.geometry = feature.geometry;
        await listing.save();
        console.log(`Updated: ${listing.title}`);
      } else {
        console.log(`No coordinates found for: ${listing.title}`);
      }
    } catch (err) {
      console.log(`Error in ${listing.title}:`, err.message);
    }
  }

  console.log("Old listings geocoding done");
}