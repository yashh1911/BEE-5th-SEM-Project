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
          const changedToCompleted = await  Booking.find(
            { status: {$in: ['active']}, endTime: { $lte: now } },
          );
          for(const booking of changedToCompleted){
            await parkingSlot.findByIdAndUpdate(booking.slotId, { status: 'available', currentBookingId: null }, { session });
            await Booking.findByIdAndUpdate(booking._id, { status: 'completed' }, { session });
            publisher.publish('slot.avaliability.update',JSON.stringify({
              slotId:booking.slotId,
              status:'available',
            }));
          }
          
          const changeToActive=await Booking.find(
            { status: 'upcoming', startTime: { $lte: now } },
          );
          for(const booking of changeToActive){
            await parkingSlot.findByIdAndUpdate(booking.slotId, { status: 'booked', currentBookingId: booking._id }, { session });
            await Booking.findByIdAndUpdate(booking._id, { status: 'active' }, { session });
            publisher.publish('slot.avaliability.update',JSON.stringify({
              lotId:booking.lotId,
              slotId:booking.slotId,
              status:'booked',
            }));
          }
        });
      }catch(err){
        console.log("Error in booking status update transaction:",err);
        await session.abortTransaction();
        await session.endSession();
      }
  });
};