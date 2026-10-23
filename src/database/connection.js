import dns from "node:dns";
import mongoose from "mongoose";
import configServices from "../config/config.services.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);


export const  dbConnection = async ()=>{
  try{
      await mongoose.connect(configServices.dbUrl);
      console.log("MongoDB connected successfully");
  }catch(error){
     console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

