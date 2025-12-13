import mongoose from 'mongoose';

const UserSchema=new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  fullname: { type: String },
  points: { type: Number, default: 0, },
  solvedTestCases:[
    {
      problemId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Problem"
      },submitDate:{
        type:Date,
        default:Date.now()
      }
    }
  ]
},{ timestamps: true  });

 const UserModel=mongoose.model('User',UserSchema);

 export default UserModel;


