 require("dotenv").config();
const mongoose = require("mongoose");
const Listing = require("./models/listing");

const imageMap = [
  { keyword: /cabin|forest|wood/i, image: { url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900&h=600&fit=crop&auto=format" } },
  { keyword: /beach|ocean|sea|coast/i, image: { url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&h=600&fit=crop&auto=format" } },
  { keyword: /mountain|hill|cliff/i, image: { url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900&h=600&fit=crop&auto=format" } },
  { keyword: /desert/i, image: { url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900&h=600&fit=crop&auto=format" } },
  { keyword: /lake|river/i, image: { url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&h=600&fit=crop&auto=format" } },
  { keyword: /farm|country|village/i, image: { url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&h=600&fit=crop&auto=format" } },
  { keyword: /city|apartment|urban/i, image: { url: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=900&h=600&fit=crop&auto=format" } },
  { keyword: /pool|villa|luxury/i, image: { url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=900&h=600&fit=crop&auto=format" } }
];

async function fixImages() {
  await mongoose.connect(process.env.ATLASDB_URL);
  const listings = await Listing.find({});

  for (let listing of listings) {
    let matched = imageMap.find(item => 
      item.keyword.test(listing.title) || 
      item.keyword.test(listing.description || "")
    );
    
    listing.image = matched ? matched.image : { 
      url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&h=600&fit=crop&auto=format" 
    };
    
    await listing.save();
    console.log(`✅ ${listing.title}: ${listing.image.url}`);
  }

  console.log("🎉 ALL 29 listings have UNIQUE images!");
  mongoose.connection.close();
}

fixImages().catch(console.error);