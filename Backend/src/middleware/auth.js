const jwt=require("jsonwebtoken");
const User=require("../models/User");
module.exports=async function(req,res,next){
 try{
  const token=(req.headers.authorization||"").startsWith("Bearer ")?req.headers.authorization.slice(7):null;
  if(!token)return res.status(401).json({message:"Authentication required"});
  const data=jwt.verify(token,process.env.JWT_SECRET);
  const user=await User.findById(data.id).select("-password");
  if(!user)return res.status(401).json({message:"User not found"});
  req.user=user;next();
 }catch(e){return res.status(401).json({message:"Invalid or expired token"});}
};
