// testStrategy.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const { generateAndStoreStrategyRecommendation } = require('./services/strategyOrchestrator');

async function main() {
  try {
    await mongoose.connect('mongodb+srv://santhosh2210429:9003203594@eventdatabase.u5mhw.mongodb.net/', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to DB");

    const vehicleId = new mongoose.Types.ObjectId("67d5a703b58892c14730aed4");

    const result = await generateAndStoreStrategyRecommendation(vehicleId);
    console.log('✅ Strategy recommendation created:', JSON.stringify(result, null, 2));

    // Optional: Wait for pending operations to fully flush
    await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
  } catch (err) {
    console.error('❌ Error generating strategy recommendation:', err);
  } finally {
    try {
      await mongoose.disconnect();
      console.log("🔌 MongoDB disconnected cleanly");
    } catch (err) {
      console.error('❌ Error during disconnect:', err);
    }
  }
}

main();
