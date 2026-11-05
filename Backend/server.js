require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
app.use(express.json());
app.get("/", (_req,res)=>res.json({message:"LifeTrack API is running"}));
app.use("/api/auth", require("./src/routes/auth"));
for (const name of ["tasks","expenses","bills","appointments","shopping","habits"]) {
  app.use(`/api/${name}`, require(`./src/routes/${name}`));
}
app.use((err,_req,res,_next)=>{ console.error(err); res.status(500).json({message:err.message || "Server error"}); });
const port = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI).then(()=>{
 console.log("MongoDB connected");
 app.listen(port,()=>console.log(`LifeTrack API running at http://localhost:${port}`));
}).catch(err=>{console.error("MongoDB connection failed:",err.message);process.exit(1);});
