import mongoose from "mongoose";


const slotSchema = new mongoose.Schema({
    lotId :{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"parkinglot"
    },
    name:{
        type:String,default:''
    },
    vertices: {
        type: [{
        x: { type: Number, required: true },
        y: { type: Number, required: true }
        }],
        _id: false
    },

    slotType:{
        type:String,
        enum:["normal","compact","large","ev","handicapped","other"],
        default:"normal",
    },
    status:{
        type:String,
        enum:["booked","avaliable","vacant","unavailable"],
        default:"avaliable",
    },
    currentbookingId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"booking",
        default:null
    }

},{
    timestamps:true,
});

const parkingSlot =mongoose.models.parkingSlot || mongoose.model("parkingSlot",slotSchema)

export default parkingSlot;