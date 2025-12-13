import mongoose from "mongoose";

const ConnectDb=async ()=>{
try{
    const connection =await mongoose.connect(process.env.MONGO_URL,{
    });
    console.log(`Database connected successfully ${connection.connection.host}`);
}catch(Err){
    console.log("Error in connecting to the database",Err);
}}

export default ConnectDb;