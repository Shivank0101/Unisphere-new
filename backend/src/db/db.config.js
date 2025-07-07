import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDb = async()=>{
    try{
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI environment variable is not defined');
        }
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('MongoDB connected successfully');
    }
    catch(error){
        console.log(`Error: ${error.message}`);
        
    }
}
export default connectDb;