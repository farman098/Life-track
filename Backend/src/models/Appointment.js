const mongoose=require("mongoose");
const schema=new mongoose.Schema({user:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},title:{type:String,required:true},person:{type:String,default:""},date:{type:Date,required:true},time:{type:String,default:""},location:{type:String,default:""},note:{type:String,default:""}},{timestamps:true});
module.exports=mongoose.model("Appointment",schema);
