import mongoose from "mongoose";
 

const checkIndexes = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const db = mongoose.connection.db;

    // Check indexes on the "tasks" collection
    const indexes = await db.collection('tasks').indexes();
    console.log('Indexes on tasks collection:', indexes);

    // Close the connection
    mongoose.connection.close();
  } catch (error) {
    console.error('Error checking indexes:', error);
    mongoose.connection.close();
  }
};

checkIndexes();
