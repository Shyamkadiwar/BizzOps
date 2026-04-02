import dotenv from 'dotenv'
    import connectDB from '../db/index.js';
    import { app } from './app.js';

    dotenv.config({
        path:'./env'
    })


    connectDB()
    .then(()=>{
        app.listen(process.env.PORT || 8000, ()=>{
            console.log(`server is running at port ${process.env.PORT}`);
        })
    })
    .catch((error)=>{
        console.log("MONGODB connection failed....",error);
    })

    // Export the express app for Vercel Serverless Functions
    export default app;