require("dotenv").config();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");

mongoose.connect(process.env.ATLASDB_URL);

const sampleListings = [
  {
    title: "Cozy Cabin in Forest",
    description: "Beautiful cabin surrounded by trees",
    image: "https://images.unsplash.com/photo-1469474968028-566ce1e683c9?w=400",
    price: 150,
    location: "Big Bear Lake, CA",
    country: "USA"
    // Remove owner field - let it be null or auto-generated
  },
  {
    title: "Beachfront Paradise", 
    description: "Ocean view beach house",
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400",
    price: 250,
    location: "Malibu, CA",
    country: "USA"
    // Remove owner field
  }
];

async function seedDB() {
  await Listing.deleteMany({});
  for (let listing of sampleListings) {
    await new Listing(listing).save();
  }
  console.log("✅ 2 listings added to database!");
  mongoose.connection.close();
}

seedDB();