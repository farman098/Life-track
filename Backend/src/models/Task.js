const mongoose=require("mongoose");
const schema=new mongoose.Schema({user:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},title:{type:String,required:true},description:{type:String,default:""},dueDate:Date,priority:{type:String,enum:["Low","Medium","High"],default:"Medium"},completed:{type:Boolean,default:false}},{timestamps:true});
module.exports=mongoose.model("Task",schema);
