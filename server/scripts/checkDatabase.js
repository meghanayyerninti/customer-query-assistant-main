const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function checkDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nCollections in database:');
    for (const collection of collections) {
      const count = await mongoose.connection.db.collection(collection.name).countDocuments();
      console.log(`- ${collection.name}: ${count} documents`);

      // Get a sample document from each collection
      const sample = await mongoose.connection.db.collection(collection.name).findOne();
      console.log('  Sample document:', JSON.stringify(sample, null, 2));
    }

  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkDatabase(); 