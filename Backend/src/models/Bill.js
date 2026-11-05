const mongoose=require("mongoose");
const schema=new mongoose.Schema({user:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},title:{type:String,required:true},amount:{type:Number,default:0,min:0},dueDate:{type:Date,required:true},paid:{type:Boolean,default:false},repeat:{type:String,enum:["None","Weekly","Monthly","Yearly"],default:"None"}},{timestamps:true});
module.exports=mongoose.model("Bill",schema);
