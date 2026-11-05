const mongoose=require("mongoose");
const schema=new mongoose.Schema({user:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},name:{type:String,required:true},completedDates:[String]},{timestamps:true});
module.exports=mongoose.model("Habit",schema);
