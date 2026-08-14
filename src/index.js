import dotenv from 'dotenv';
dotenv.config({
    path:"../.env"
})
import connectDB from './db/db.js';
import app from './app.js'



connectDB()
.then(()=>{

    const port = process.env.PORT || 8000;

    app.listen(port,()=>{
        console.log(`serving at http://localhost:${port}`)
    })

}).catch((error)=>{
    console.log("MongoDB connection failed: ",error)
})