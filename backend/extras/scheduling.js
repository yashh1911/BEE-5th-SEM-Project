import cron from "node-cron";
import Booking from "../model/bookingModel.js";
import mongoose from "mongoose";
import { publisher } from "../../shared/index.js";
import parkingSlot from "../model/parkingSlot.js";

export const schedulingJob =async function(){
  cron.schedule('*/30 * * * * *', async () => {
    const session = await mongoose.startSession();

      const now = new Date();
      now.setHours(now.getHours() + 5);     // add 5 hours
      now.setMinutes(now.getMinutes() + 30); // add 30 minutes
      console.log(now)
      try{
        await session.withTransaction(async () => {
          const changedToCompleted = await  Booking.updateMany(
            { status: {$in: ['active', 'upcoming']}, endTime: { $lte: now } },
            { status: 'completed' }
          );
          await Booking.updateMany(
              { status: 'upcoming', startTime: { $lte: now } },
              { status: 'active' }
          );
        });
      }catch(err){
        console.log("Error in booking status update transaction:",err);
        await session.abortTransaction();
        await session.endSession();
      }
  });
};

