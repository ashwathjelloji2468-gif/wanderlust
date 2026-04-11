 require("dotenv").config();
const mongoose = require("mongoose");
const Listing = require("./models/listing");
const initData = require("./init/data");

async function main() {
  await mongoose.connect(process.env.ATLASDB_URL);

  await Listing.deleteMany({});
  await Listing.insertMany(initData.data);

  console.log(`✅ Restored ${initData.data.length} listings`);
  await mongoose.connection.close();
}

main().catch((err) => {
  console.error(err);
  mongoose.connection.close();
});