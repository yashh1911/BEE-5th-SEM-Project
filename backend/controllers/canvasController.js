import parkingLot from "../model/parkingLotModel.js";
import parkingSlot from "../model/parkingSlot.js";
import Booking from "../model/bookingModel.js";


export async function displayLot(req,res){
    const {lotId} = req.params;
    const {startTimeVar,endTimeVar} = req.body;
    if(!lotId ) return res.status(400).json({success:false,message:"invalid lot id"});
    let finaldata = {};
    try{
        const lot = await parkingLot.findById(lotId);
        if(!lot) return res.status(404).json({success:false,message:"lot not found"});
        finaldata.boundary = {
            name:lot.name,
            units:lot.units,
            vertices:lot.boundary
        }
        const slots = await parkingSlot.find({lotId:lot._id});


        finaldata.slots = await Promise.all(slots.map(async(s)=>{
                let status="vacant";
                const {_id,name,vertices,slotType,currentbookingId} = s;
                if(s.status==="unavaliable")return{_id,name,vertices,slotType,currentbookingId,status:"unavaliable"}
                // check for booking in the given time interval
                const timeBasedStatus = await Booking.find({
                    slotId:s._id,
                    lotId:lot._id,
                    status: { $in: ["upcoming", "active"] },
                    startTime: { $lt: new Date(endTimeVar) },
                })
                if(timeBasedStatus.length>0)status="booked";
                
                return {_id,name,vertices,slotType,currentbookingId,status}

            })
        );
        return res.status(200).json(finaldata);
    }catch(err){
        console.error(err);
        return res.status(500).json({success:false,message:"internal server error"});
    }
}







