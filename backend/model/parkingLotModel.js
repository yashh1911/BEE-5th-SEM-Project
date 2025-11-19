import mongoose from "mongoose";
const lotSchema = new mongoose.Schema({

    name: { 
        type: String, required: true, trim: true 
    },
    description: { 
        type: String, default: '' 
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true
    },
    units: {
        type: String, default: 'mm',enum:["mm","m","cm","ft","inches","km"]
    },
    boundary: {
        type: [{
            x: { type: Number, required: true },
            y: { type: Number, required: true }
        }],
        _id: false
    },
    hourlyRates:{
        type:Number,
        required:true,
    },
    meta: {
        location:{
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true },
            AddressLine:{type:String,required:true},
            City:{type:String,required:true},
            State:{type:String,required:true},
            Pincode:{type:String,required:true}
        }
        
    },
}, {
    timestamps: true,
});

const parkingLot =  mongoose.models.parkingLot || mongoose.model("parkingLot", lotSchema);
export default parkingLot;
