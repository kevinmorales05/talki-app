const mongoose = require('mongoose');

async function dropIndex() {
  const uri = "mongodb+srv://mongo:mongodb@myclusterkev.viocxv8.mongodb.net/talkidb?retryWrites=true&w=majority";
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const collection = db.collection('kids');
    
    console.log("Dropping index user_id_1...");
    await collection.dropIndex("user_id_1");
    console.log("Successfully dropped index.");
  } catch (error) {
    if (error.codeName === 'IndexNotFound') {
      console.log("Index not found, it's already dropped.");
    } else {
      console.error("Error dropping index:", error);
    }
  } finally {
    await mongoose.disconnect();
  }
}

dropIndex();
