import mongoose from "mongoose";
const RawSchema= new mongoose.Schema({
_id:{
    type:String,
    unique:true
},userId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index:true
},langugae:{
    type:String
},code:{
    type:String
},execution_time:{
    type:Number
},status:{
    type:String,
    default:"failed"
},output:{
    type:String
}

},{
    timestamps:true
})

const RawExecution=mongoose.model("RawExecution",RawSchema)
export default RawExecution