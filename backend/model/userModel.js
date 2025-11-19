import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        trim:true,
    },
    email:{
        type:String,
        required:true,
        trim:true,
    },
    password:{
        type:String,
        required:true,
    },
    type:{
        type:String,
        enum:["Customer","Vendor"],
        default:"Customer"
    },

})



const user = mongoose.models.user || mongoose.model("user",userSchema);
export default user;



