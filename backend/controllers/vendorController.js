import parkingSlot from "../model/parkingSlot.js";
import parkingLot from "../model/parkingLotModel.js";
import booking from "../model/bookingModel.js"
import mongoose from 'mongoose';


export const viewAllLots = async(req,res)=>{
    try{
        const mylots = await parkingLot.find({createdBy:req.user.userId}).select('-createdBy -units -boundary');
        console.log(req.user.userId)
        console.log(mylots);
        if(!mylots || mylots.length<=0)return res.status(200).json({status:true,message:"No lots created yet ",data:[]});
        return res.status(200).json({status:true,message:"got the lots  ",data:mylots})

    }catch(err){
        console.log("error in fething all lots ",err.message)
        return res.status(500).json({status:false,message:"Internal Server Error "});

    }
}

export const viewLot = async(req,res)=>{
    try{
        const lotId = req.params.lotid;
        const vendorId = req.user.userId;
        // console.log(req.user)
        const mylot = await parkingLot.findOne({_id:lotId,createdBy:vendorId});
        if(!mylot)return res.status(202).json({status:false,message:"No such Lot associated to u"})
        return res.status(202).json({status:true,message:"fetch success ",data:mylot});

    }catch(err){
        console.log("error in fething specific lot for vendor ",err.message);;
        return res.status(500).json({status:false,message:"Internal Server Error"});
    }
}

export const displayCurrent = async(req,res)=>{
    try{
        const lotId = req.params.lotid;
        const vendorId = req.user.userId;
        const lot = await parkingLot.find({_id:lotId,createdBy:vendorId});
        console.log(lot)
        if(!lot)return res.status(404).json({success:"flase",message:"lot not associated with vendor"});
        let finaldata={};
        finaldata.boundary = {
            name:lot.name,
            units:lot.units,
            vertices:lot.boundary
        }
        const slots = await parkingSlot.find({lotId:lotId}).select('name vertices slotType status currentbooingId');


        finaldata.slots = slots
        // console.log(finaldata);
        return res.status(200).json({success:true,data:finaldata});

    }catch(err){
        return res.status(500).json({success:false,message:"Internal Server Error"});
    }
}

export const manualBooking = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const vendorId = req.user.userId;
    const { lotId, slotId } = req.params;
    console.log(lotId, slotId);
    const lot = await parkingLot.findOne({ _id: lotId, createdBy: vendorId }).lean();
    if (!lot) {
      return res.status(404).json({ success: false, message: "Lot not associated to vendor" });
    }
    const now = new Date();
    now.setHours(now.getHours() + 5);
    now.setMinutes(now.getMinutes() + 30);

    const nextFourHours = new Date(now.getTime() + 4 * 60 * 60 * 1000);

    await session.withTransaction(async () => {
      const slot = await parkingSlot.findOne({ _id: slotId, lotId}).session(session);
      if (!slot) throw new Error("Slot not present onParking Lot");
    //   console.log(slot);
      if(slot.status!="avaliable"){throw new Error("Slot is not available for booking");}

      const overlap = await booking.find({
        slotId,
        lotId,
        startTime: { $lte: nextFourHours },
        status: { $in: ["active", "upcoming"] },
      }).session(session);

      if (overlap.length > 0) throw new Error("Overlapping booking in next 4 hours");

      const newBooking = await   booking.create(
        [{
          userId: vendorId,
          slotId,
          lotId,
          startTime: now,
          status: "active",
          type:"manual",
        }],
        { session }
      );
      console.log("New Booking Created:", newBooking[0]._id);
      slot.status = "booked";
      slot.currentbookingId = newBooking[0]._id;
      await slot.save({ session });
    });

    await session.endSession();
    return res.status(200).json({ success: true, message: "Manual booking successful" });

  } catch (err) {
    await session.abortTransaction().catch(() => {}); // safe cleanup
    await session.endSession();
    console.error("Error in manual booking:", err.message);
    return res.status(500).json({ success: false, message: err.message || "Internal Server Error" });
  }
};

export const manualComplete = async(req,res)=>{
    const session = await mongoose.startSession();
    try{
        const vendorId = req.user.userId;
        const { lotId, slotId } = req.params;
        const lot = await parkingLot.findOne({ _id: lotId, createdBy: vendorId }).lean();
        if (!lot) {
          return res.status(404).json({ success: false, message: "Lot not associated to vendor" });
        }
        const now = new Date();
        now.setHours(now.getHours() + 5);
        now.setMinutes(now.getMinutes() + 30);
        await session.withTransaction( async()=>{
            const slot = await parkingSlot.findOne({ _id: slotId, lotId }).session(session);
            if (!slot) throw new Error("Slot not found in the specified lot"); 
            // console.log(slot)
            if(!slot.currentbookingId) throw new Error("No active booking for this slot");

            const bookingRecord = await booking.findOne({_id:slot.currentbookingId,slotId:slotId,lotId:lotId,status:"active",type:"manual"}).session(session);
            if(!bookingRecord) throw new Error("No active booking found to complete");
            await booking.findByIdAndUpdate(
                bookingRecord._id,
                {status:"completed",endTime:now},
                {session}
            )
            slot.status = "avaliable";
            slot.currentbookingId = null;
            await slot.save({session});
        });

        await session.endSession();
        return res.status(200).json({ success: true, message: "Manual booking ended successful" });

    } catch (err) {
        await session.abortTransaction().catch(() => {}); // safe cleanup
        await session.endSession();
        console.error("Error in manual completion:", err.message);
        return res.status(500).json({ success: false, message: err.message || "Internal Server Error" });
    }
};

export const changeAvaliability = async(req,res)=>{
    try{
        const lotid = req.params.lotid;
        const vendorId =req.user.userId;
        const{ slotIds,statusto} =req.body;
        const  session = await mongoose.startSession();
        if(statusto!="unavaliable" && statusto!="avaliable")return res.status(404).json({success:false,message:"invalid status changes asked"})
        const lot = await parkingLot.findOne({_id:lotid,createdBy:vendorId});
        if(!lot)return res.status(404).json({success:false,message:"lot not associated with user"})

        const updatedStatus= statusto;
        const prevStatus = (updatedStatus=="avaliable"?"unavaliable":"avaliable");


        
        try {
            const session = await mongoose.startSession();
            session.startTransaction();

            await parkingSlot.updateMany(
                { _id: { $in: slotIds }, lotId: lotid },
                { $set: { status: updatedStatus, currentBookingId: null }},
                { session }
            );

            if (prevStatus === "available") {
                await booking.updateMany(
                    { slotId: { $in: slotIds }, status: { $in: ["active", "upcoming"] }},
                    { $set: { status: "refunded" }},
                    { session }
                );
            }

            await session.commitTransaction();
            session.endSession();
            console.log("valid availability transaction");

        }catch(err){
            console.log("error in atomic avaliability",err.message);
            await session.abortTransaction();
            return res.status(500).json({success:false,message:"Internal Server Error"});
        }
        session.endSession();
        return res.status(200).json({success:true,message:"Succes in Status Correction"})


    }catch(err){
        console.log("error in changing avaliability",err.message);
        return res.status(500).json({success:false,message:"Internal Server Error"});
    }
}