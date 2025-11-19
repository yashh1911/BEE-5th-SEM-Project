import Booking from "../model/bookingModel.js";
import parkingSlot from "../model/parkingSlot.js";
import mongoose, { MongooseError } from "mongoose";
import parkingLot from "../model/parkingLotModel.js";

// show all the lots in the area 
export const showLots = async(req,res)=>{
    try{
        const Lots = await parkingLot.find({},'name description boundary meta createdBy').lean();
        if(Lots.length<=0){
            return res.status(404).json({message:"No parking lots found"});
        }
        return res.status(200).json({message:"success",data:Lots});
        
    }
    catch(error){
        console.log("Error in showLots:",error);
        return res.status(500).json({message:"Internal server error",error:error.message});
    }
}

