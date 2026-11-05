const mongoose=require("mongoose");
const schema=new mongoose.Schema({user:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},name:{type:String,required:true},quantity:{type:String,default:"1"},purchased:{type:Boolean,default:false}},{timestamps:true});
module.exports=mongoose.model("ShoppingItem",schema);
