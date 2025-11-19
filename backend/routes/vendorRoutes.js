import { Router } from "express";
import multer from "multer";
import {parseAndCreateParkingLot} from "../controllers/uploadController.js";
import {authenticateToken} from "../controllers/authController.js";
const route = Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "image/vnd.dxf",
      "application/dxf",
      "application/x-dxf",
      "application/x-autocad"
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);  // Accept the file
    } else {
      cb(new Error("Invalid file type. Only DXF files are allowed."), false);
    }
  }
});



route.post("/upload/", authenticateToken, upload.single("dxfFile"), parseAndCreateParkingLot);


import { viewAllLots,viewLot,displayCurrent,changeAvaliability,manualBooking,manualComplete } from "../controllers/vendorController.js";

route.get("/lots",authenticateToken,viewAllLots);
route.get("/lot/:lotid",authenticateToken,viewLot);
route.get("/lot/:lotid/display",authenticateToken,displayCurrent);
route.patch("/lot/:lotid/status",authenticateToken,changeAvaliability);
route.post("/lot/:lotid/manualbooking",authenticateToken,manualBooking);
route.post("/lot/:lotid/manualcomplete",authenticateToken,manualComplete);




export default route;



