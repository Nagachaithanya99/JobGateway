import mongoose from "mongoose";

export default async function connectDB(uri) {
  mongoose.set("strictQuery", true);

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });
  mongoose.connection.on("reconnected", () => {
    console.log("MongoDB reconnected");
  });
  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err?.message || err);
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 15,
  });

  console.log("MongoDB connected");
}
