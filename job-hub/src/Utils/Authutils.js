import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken';
import dotenv from "dotenv"
dotenv.config()

const hashPassword=async(plain,rounds=10)=>{
    return  await bcrypt.hash(plain, rounds)
}

const verifyPassword=async(plain,hashed)=>{
    return await bcrypt.compare(plain,hashed);
}

const CreateAccessToken = (id,email,fullname) => {
    const payload = {
      id: id,
      fullname,
      email,
    };
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
  }
  
  const CreateRefreshToken = (id,email,fullname) => {
    const payload = {
      id: id,
      email,
      fullname
    };
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
  }

export{
    hashPassword,verifyPassword,
    CreateAccessToken,CreateRefreshToken
}