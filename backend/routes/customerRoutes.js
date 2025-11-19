import { showLots,bookingSlot,viewBookings,cancelbooking } from "../controllers/customerController.js";
import {Router} from "express";
const router = Router();
import { authenticateToken } from "../controllers/authController.js";
router.get("/showlots",authenticateToken,showLots);
router.post("/bookslot/:lotid",authenticateToken,bookingSlot);
router.get("/mybookings",authenticateToken,viewBookings);
router.patch("/cancelbooking/:bookingid",authenticateToken,cancelbooking);
export default router;