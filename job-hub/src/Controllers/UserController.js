import asyncHandler from "../Utils/AsyncHandler.js"
import ApiError from "../Utils/ApiError.js"
import ApiResponse from "../Utils/ApiResponse.js"
import prisma from "../Utils/PrismaProvider.js"
import Joi from "joi"
import { hashPassword,verifyPassword,CreateAccessToken,CreateRefreshToken } from "../Utils/Authutils.js"

const registerScheama=Joi.object({
    email:Joi.string().email().required(),
    fullname:Joi.string().max(20).min(5).required(),
    password:Joi.string().min(6).required()
})

const loginSchema=Joi.object({
    email:Joi.string().email().required(),
    password:Joi.string().min(6).required()
})

const RegisterUser=asyncHandler(async(req,res)=>{
   const {error,value}=registerScheama.validate(req.body)

   if(error){
     throw new ApiError(400, "Invalid input", error.details.map(d => d.message));
   }

   const userExists=await prisma.user.findFirst({
    where:{
        email:value.email
    }
   })

   if(userExists){
    throw new ApiError(400,'User with this email already exists')
   }
   const pwd=await hashPassword(value.password)
   const newUser=await prisma.user.create({
    data:{
   email:value.email,
    fullname:value.fullname,
    password:pwd
    }
   })
   return res.send (new ApiResponse(200,"User registered succesfully",newUser))
})

const LoginUser=asyncHandler(async(req,res)=>{
const {error,value}=loginSchema.validate(req.body)
    if(error){
        throw new ApiError(400,'invlaid crednetials',error.details.map(d => d.message))
    }

    const  exisingUser=await prisma.user.findFirst({
        where:{
            email:value.email
        }
        ,select:{
            id:true,
            email:true,
            password:true,
            fullname:true
        }
        
    })
    if(!verifyPassword(value.password,exisingUser.password)){
        throw new ApiError(400,"invalid credentials")
    }
    const newAccessToken=CreateAccessToken(exisingUser.id,exisingUser.email,exisingUser.fullname)
    const newRefreshToken=CreateRefreshToken(exisingUser.id,exisingUser.email,exisingUser.fullname)

    res.cookie("accessToken",newAccessToken,{
    httpOnly: true,
    secure: false,
    maxAge: 10 * 60 * 1000,
    path: "/",
    })

    res.cookie("refreshToken",newRefreshToken,{
    httpOnly: true,
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
    })

    res.send(new ApiResponse(200,"user logged in succesfully"))
})

const LogoutUser=asyncHandler(async(req,res)=>{
    res.clearCookie("accessToken",{
    httpOnly: true,
    secure: false,
    path: "/",
    })
    res.clearCookie("refreshToken",{
    httpOnly: true,
    secure: false,
    path: "/",
    })
    res.send(new ApiResponse(200,'User logged out succesfully'))
})



export {
    RegisterUser,LoginUser,LogoutUser
}