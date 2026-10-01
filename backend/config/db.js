import mongoose from "mongoose";



export const connectDB = async () => {
    await mongoose.connect("mongodb://dilip1195be24_db_user:DILIP1207@ac-eqxelrk-shard-00-00.xin8v7j.mongodb.net:27017,ac-eqxelrk-shard-00-01.xin8v7j.mongodb.net:27017,ac-eqxelrk-shard-00-02.xin8v7j.mongodb.net:27017/?ssl=true&replicaSet=atlas-tuhxni-shard-0&authSource=admin&appName=Cluster0")
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((err) => {
        console.log("MongoDB connection failed", err);
    });
}
