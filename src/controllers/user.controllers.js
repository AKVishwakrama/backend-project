import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"


const getAccessAndRefreshToken = async(userId) =>{
        try {
   const user = await User.findById(userId)
   const accessToken = user.generateAccessToken()
   const refreshToken = user.generateRefreshToken()

   user.refreshToken = refreshToken
    await user.save({validateBeforeSave : false})

    return accessToken , refreshToken ;
        }
        catch(error) {
                throw new ApiError (500 , "Something went wrong while generating refresh and access token ")

        }
}

const registerUser = asyncHandler( async (req , res) => {
   const {fullName , email , password , username} = req.body
   console.log("email:", email );

   if(fullName === ""){
throw new ApiError(400 , "fullname is required")
   }

   if(email === ""){
throw new ApiError(400 , "email is required")
   }

   if(password === ""){
throw new ApiError(400 , "password is required")
   }
   if(username === ""){
throw new ApiError(400 , "username is required")
   }
   const existedUser = await User.findOne({
        $or : [{username} , {email}]

   })
   if(existedUser){
        throw new ApiError(400 , "User with email or username")
   }


const avatarLocalPath = req.files?.avatar[0]?.path;
 const coverImageLocalPath = req.files?.coverImage[0]?.path;


 if(!avatarLocalPath) {
        throw new ApiError(400 , "something went wrong")
}

const avatar = await uploadOnCloudinary(avatarLocalPath)
const coverImage = await uploadOnCloudinary(coverImageLocalPath)

if(!avatar) {
        throw new ApiError(400 , "avatar is required")
}
 const user = await User.create({
        fullName,
        avatar : avatar.url,

        coverImage : coverImage?.url || "",
        email, 
        password,
        username : username.toLoweCase()
})

const createdUser = await User.findById(user._id).select(
        "-password --refreshToken"
)

if(!createdUser){
        throw new ApiError(500 , "User not found" )
}

 res.status(201).json(
        new ApiResponse(200, createdUser , "User Registered Sucessfully")
)

}) 

const loginUser = asyncHandler( async (req , res) => {

        const {username , email ,password} = req.body
        if(!username || ! email)
        {
throw new ApiError (400 , "username or password is required")
        }

     const user = await User.findOne({
                $or : [{email ,username}]
        })
        if(!user){
                throw new ApiError (404 , "user does not exists")
        }

        const isPasswordValid = await user.isPasswordCorrect(password)
        if(!isPasswordValid){
                throw new ApiError (401 , "password is wrong")
        
        }

         const {accessToken , refreshToken} =await getAccessAndRefreshToken(user._id)
const LoggedUser = await User.findById(user._id)
select("-password -refreshToken")

const options ={
        httpOnly : true,
        secure : true
}
return res
.status(200)
.cookie("accessToken" , accessToken , options)
.cookie("refreshToken", refreshToken , options)
.json(
        new ApiResponse(
                200,
                {
                        user : LoggedUser , accessToken, refreshToken
                },
                "User logged In Sucessfully"
        )
)
})

const logoutUser = asyncHandler(async(req , res) => {
User.findByIdAndUpdate(
        req.user.id,
         {
                $set : {
                        refreshToken : undefined
                }

        },
        {
                new : true
        }
)  
const options = {
        httpOnly : true ,
        secure : true
}      


return res 
.status(200)
.clearCookie( "accessToken",accessToken , options )
.json(new ApiResponse(200 , {} , "User logged out"))
})
     

export {registerUser ,loginUser , logoutUser
        

}