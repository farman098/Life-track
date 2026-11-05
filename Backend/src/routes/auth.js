const router=require("express").Router();
const bcrypt=require("bcryptjs"),jwt=require("jsonwebtoken");
const User=require("../models/User"),auth=require("../middleware/auth");
const tokenFor=u=>jwt.sign({id:u._id},process.env.JWT_SECRET,{expiresIn:"7d"});
const safe=u=>({id:u._id,name:u.name,email:u.email});
router.post("/register",async(req,res,next)=>{
 try{
  const {name,email,password}=req.body;
  if(!name||!email||!password)return res.status(400).json({message:"Name, email and password are required"});
  if(password.length<8)return res.status(400).json({message:"Password must be at least 8 characters"});
  const normalized=String(email).toLowerCase().trim();
  if(await User.findOne({email:normalized}))return res.status(409).json({message:"Email already registered"});
  const user=await User.create({name,email:normalized,password:await bcrypt.hash(password,12)});
  res.status(201).json({token:tokenFor(user),user:safe(user)});
 }catch(e){next(e);}
});
router.post("/login",async(req,res,next)=>{
 try{
  const user=await User.findOne({email:String(req.body.email||"").toLowerCase().trim()});
  if(!user||!await bcrypt.compare(req.body.password||"",user.password))return res.status(401).json({message:"Invalid email or password"});
  res.json({token:tokenFor(user),user:safe(user)});
 }catch(e){next(e);}
});
router.get("/me",auth,(req,res)=>res.json({user:safe(req.user)}));
module.exports=router;
