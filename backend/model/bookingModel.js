import mongoose from "mongoose"; 

const BookingSchema = mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"user"
    },
    slotId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"parkingSlot"
    },
    lotId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"parkingLot"
    },
    startTime:{
        type:Date,
        required:true
    },
    status:{
        type:String,
        enum:["upcoming","cancelled","completed","active"],
        default:"upcoming"
    },
    endTime:{
        type:Date,
        default:null
    }
})


const Booking =  mongoose.models.booking || mongoose.model("booking",BookingSchema);
export default Booking;