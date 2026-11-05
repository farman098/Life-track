const router=require("express").Router();
const Model=require("../models/Task");
const auth=require("../middleware/auth");
router.use(auth);
// Every operation is restricted to the authenticated user's own records.
router.get("/",async(req,res,next)=>{try{res.json(await Model.find({user:req.user._id}).sort({createdAt:-1}));}catch(e){next(e);}});
router.post("/",async(req,res,next)=>{try{const item=await Model.create({...req.body,user:req.user._id});res.status(201).json(item);}catch(e){next(e);}});
router.patch("/:id",async(req,res,next)=>{try{const item=await Model.findOneAndUpdate({_id:req.params.id,user:req.user._id},{$set:req.body},{new:true,runValidators:true});if(!item)return res.status(404).json({message:"Record not found"});res.json(item);}catch(e){next(e);}});
router.delete("/:id",async(req,res,next)=>{try{const item=await Model.findOneAndDelete({_id:req.params.id,user:req.user._id});if(!item)return res.status(404).json({message:"Record not found"});res.json({message:"Record deleted"});}catch(e){next(e);}});
module.exports=router;
