const mongoose=require("mongoose");
const schema=new mongoose.Schema({user:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},title:{type:String,required:true},amount:{type:Number,required:true,min:0},category:{type:String,default:"Other"},date:{type:Date,default:Date.now},note:{type:String,default:""}},{timestamps:true});
module.exports=mongoose.model("Expense",schema);
