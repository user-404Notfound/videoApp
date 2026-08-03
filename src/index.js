import dotenv from 'dotenv';
import express from 'express';
import connectDB from './db/db.js';
import app from './app.js'

dotenv.config({
    path:"../.env"
})

connectDB()
.then(()=>{

    const port = process.env.PORT || 8000;

    app.listen(port,()=>{
        console.log(`serving at http://localhost:${port}`)
    })

}).catch((error)=>{
    console.log("MongoDB connection failed: ",error)
})