import express, { urlencoded } from 'express';
import cors from 'cors';
import dbconnect from "./db/dbconnect.js";
const app = express();
app.use(cors());
app.use(express.json());
app.use(urlencoded({ extended: true }));
import userRoutes from "./routes/userRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";
import canvasRoutes from "./routes/canvasRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
const port = 4444;

app.get("/",(req,res)=>{
    res.send("home page ")
})

app.use("/api/users", userRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/canvas", canvasRoutes);
app.use("/api/customers", customerRoutes);
dbconnect();



const server = app.listen(port,()=>{
    console.log(`Server started on port ${port}`);
})

import {WebSocketServer} from 'ws';
const wss = new WebSocketServer({server})