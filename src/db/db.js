import mongoose from 'mongoose';
import {DB_Name } from '../constants.js'

const connectDB = async () => {
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_Name}`)
        console.log(`MongoDB connection Sucessful !! DB_HOST = ${connectionInstance.connection.host}`)
    } catch(error){
        console.error("MongoDB connection failed : ",error);
        process.exit(1)
    }
}

export default connectDB;