import parkingSlot from "../model/parkingSlot.js";
import parkingLot from "../model/parkingLotModel.js";
import user from "../model/userModel.js"
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
        console.dir(finaldata);
        return res.status(200).json({success:true,data:finaldata});

    }catch(err){
        return res.status(500).json({success:false,message:"Internal Server Error"});
    }
}

