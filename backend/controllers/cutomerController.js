import Booking from "../model/bookingModel.js";
import parkingSlot from "../model/parkingSlot.js";
import mongoose, { MongooseError } from "mongoose";
import parkingLot from "../model/parkingLotModel.js";

// show all the lots in the area 
export const showLots = async(req,res)=>{
    try{
        const {start,end} = req.query;
        const Lots = await parkingLot.find({},'name description boundary meta createdBy').lean();
        if(Lots.length<=0){
            return res.status(404).json({message:"No parking lots found"});
        }
        for (const lot of Lots) {
            const slots = await parkingSlot.find({lotId:lot._id,status:"available"}).select("_id").lean();
            lot.totalSlots = slots.length;
        }
        const startTimeVar = new Date(start);
        const endTimeVar =end?end: new Date(startTimeVar.getDate()+1);
        for (const lot of Lots) {
            const slots = await parkingSlot.find({lotId:lot._id,status:"available"}).select('_id ').lean();
            let availableCount = 0;
            await Promise.all(slots.map( async(s)=>{
                const overlappingBooking = await Booking.findOne({
                    slotId: s._id,
                    lotId: lot._id,
                    status: { $in: ["upcoming", "active"] },
                    startTime: { $lt: endTimeVar  },
                    endTime: { $gt: startTimeVar }
                });
                if(!overlappingBooking)availableCount++;
            }));
            lot.totalSlots = availableCount;
        }
        
        return res.status(200).json({message:"success",data:Lots});
    }
    catch(error){
        console.log("Error in showLots:",error);
        return res.status(500).json({message:"Internal server error",error:error.message});
    }
}

// to display the current status of slots on a specific lot for customer
export const displayCurrentCus = async(req,res)=>{
    try{
        const {start,end}=req.query; 
        const lotId = req.params.lotid;
        const lot = await parkingLot.find({_id:lotId,createdBy:vendorId});
        console.log(lot)
        if(!lot)return res.status(404).json({success:false,message:"Invalid lot Id"});
        let finaldata={};
        finaldata.boundary = {
            name:lot.name,
            units:lot.units,
            vertices:lot.boundary
        }
        const slots = await parkingSlot.find({lotId:lotId}).select('name vertices slotType status currentbooingId');
        for(const s of slots){
            if(s.status!="unavailable"){
                const overlappingBooking = await Booking.findOne({
                    slotId: s._id,
                    lotId: lot._id,
                    status: { $in: ["upcoming", "active"] },
                    startTime: { $lt: end } ,
                    endTime: { $gt: new Date(start) }
                });
                if(overlappingBooking){
                    s.status="booked";
                }else{
                    s.status="available";
                }
            }
        }

        finaldata.slots = slots
        console.dir(finaldata);
        return res.status(200).json({success:true,data:finaldata});

    }catch(err){
        return res.status(500).json({success:false,message:"Internal Server Error"});
    }
}
// to book a no fo slots on a specific lot
export const bookingSlot = async(req,res)=>{
    try{
        const {lotid} = req.params;
        const {slotids , startTimeVar , endTimeVar} = req.body;
        const lot = await parkingLot.findById(lotid);
        if(!lot){
            return res.status(404).json({message:"Parking lot not found"});
        }

        // this will just return a response if an invalid slot or the slot is already booked in the same time interval
        const validids =await Promise.all( slotids.map(async(id)=>{
            const slot = await  parkingSlot.find({
                _id:id,
                lotId:lotid,
                status:"avaliable",
            })
            if(!slot)return null;
            const overlappingBooking = await Booking.findOne({
                slotId:id,
                lotId:lotid,
                status: { $in: ["upcoming", "active"] },
                startTime: { $lt: new Date(endTimeVar) },
                endTime: { $gt: new Date(startTimeVar) }
            });
            if(overlappingBooking) return null ;
            else return id;
        })
    );
        if(validids.includes(null)){
            return res.status(400).json({success:false,message:"One or more slots are invalid or already booked in the selected time interval"});
        }


        // now we can create the booking in the booking collection

        let booking = slotids.map((id) => {
        
            const newBooking = new Booking({
                userId:new mongoose.Types.ObjectId(req.user.userId),
                slotId:new mongoose.Types.ObjectId(id),
                lotId:new mongoose.Types.ObjectId(lotid),
                startTime:new Date(startTimeVar),
                endTime:new Date(endTimeVar),
            })
            return newBooking;
        });
        // console.log("booking array created",booking);
        // console.log(booking);

        await Booking.insertMany(booking);

        return res.status(200).json({status:"success",message:"Bookings created successfully"});

    }catch(error){
        console.log("Error in bookingsSlot:",error);
        return res.status(500).json({message:"Internal server error",error:error.message});
    }
}
// to view all booking of a customer
export const viewBookings = async(req,res)=>{
    try{
        const userId = req.user.userId;
        console.log("userId:",userId);
        const bookings = await Booking.find({userId:new mongoose.Types.ObjectId(userId)})
        .populate('slotId','name slotType status')
        .populate('lotId','name hourlyRates meta.location.AddressLine meta.location.City meta.location.State meta.location.Pincode')
        return res.status(200).json({success:"true",data:bookings});
    }
    catch(error){
        console.log("Error in viewBookings:",error);
        return res.status(500).json({success:"false",message:"Internal server error",error:error.message});
    }
};
//to cancel a booking (its actually patching))
export const cancelbooking = async(req,res)=>{
    try{
        const bookingid = req.params.bookingid;
        const booking = await Booking.findOneAndUpdate({_id:bookingid,userId:req.user.userId,status:"upcoming"},{status:"cancelled"}, {new:true});
        if(!booking){
            return res.status(404).json({success:"false",message:"Booking not found or booking Active/cancelled "});
        }
        return res.status(200).json({success:"true",message:"Booking cancelled successfully"});
    }
    catch(error){
        console.log("Error in cancelBooking:",error);
        return res.status(500).json({success:"false",message:"Internal server error",error:error.message});
    }
}