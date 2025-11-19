import { Router } from "express";
const router = Router();
import {registerController,loginController} from "../controllers/userContoller.js";

router.post("/login",loginController);
router.post("/register",registerController);

export default router;


