import mongoose from "mongoose";
import { schedulingJob} from '../extras/scheduling.js';



const dbconnect = async ()=>{
    try{
        await mongoose.connect("mongodb://localhost:27017/parkease");
        console.log("connected to the server");
        schedulingJob();
    }
    catch(err){
        console.log("error in connecting to the server",err);
    }
}

export default dbconnect;

