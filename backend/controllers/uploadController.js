import parkingLot from "../model/parkingLotModel.js";
import parkingSlot from "../model/parkingSlot.js";
import DXFParser from "dxf-parser";
import mongoose from "mongoose";

export async function parseAndCreateParkingLot(req, res) {
    try {    
        
        if (!req.file) {
            return res.status(400).json({ success: false, message: "DXF file is required" });
        }
        
        // Get vendor ID from the authenticated user's token
        const vendorId = req.user.userId;
        
        const isexists = await parkingLot.findOne({createdBy:new mongoose.Types.ObjectId(vendorId),name:req.body.name});
        if(isexists){
            return res.status(400).json({ success: false, message: "Parking lot with same name already exists" });
        }
        // Parse DXF file
        const parser = new DXFParser();
        const dxfData = req.file.buffer
        let dxfJson;
        try {
            dxfJson = parser.parseSync(dxfData.toString("utf-8"));
        } catch (err) {
            return res.status(400).json({ success: false, message: "Invalid DXF file" });
        }
        // console.log({dxfJson});
        return res.status(200).json(await creatLotDocument(dxfJson,req.body,{vId: vendorId}) );
        // res.send("vefve");
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}


async function creatLotDocument(dxfJson,info,params){
    const entities = dxfJson.entities;
    const boundary = entities.find(e=>(e.type==="LWPOLYLINE" && e.layer.toLowerCase()==="boundary" && Array.isArray(e.vertices)) );
    if(!boundary)return {success:false,message:"invalid boundary "};
    try{
        const newLot = new parkingLot({
            name:info.name,
            ...((info?.desc)? {description:info.description}:{} ),
            createdBy : params.vId,// for mow getting from form only 
            units:info.units,
            boundary:boundary.vertices,
            hourlyRates:info.hourlyRates,
            meta:{
                location:{
                    latitude:info.latitude,
                    longitude:info.longitude,
                    AddressLine:info.AddressLine,
                    City:info.City,
                    State:info.State,
                    Pincode:info.Pincode
                }
            }
        })
        const lotId = await newLot.save();
        console.log("done with lot creation");
        // now for parking slots ...
        entities.forEach(async (e)=>{
            if(e.type==="LWPOLYLINE" && e.layer.toLowerCase()==="parkinglot" && Array.isArray(e.vertices) ){

                const newslot = new parkingSlot({
                    lotId,
                    vertices:e.vertices,
                })
                await newslot.save();

            }
        })
    return {success:true,message:"parking lot and slots created successfully ",lotId};

    }catch(err){
        return {success:false,message:err.message};
    }
}

