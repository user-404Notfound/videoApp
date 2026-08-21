import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'

const userRegister = asyncHandler(async (req,res) => {

    const {fullname,username,email,password} = req.body;

    if (
        [fullname,username,email,password].some( (field) => field?.trim() === "")
    ) {
        throw new ApiError(400,"All fields are required");
    }

    const existedUser = await User.findOne({
        $or:[{username},{email}]
    })

    if (existedUser){
        throw new ApiError(409,'User with email or username already Exists');
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400,'Avatar is required');
    }
    
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar){
        throw new ApiError(400,"avatar upload failed");
    }

    const user = await User.create({
        fullname:fullname,
        username:username.toLowerCase(),
        password:password,
        email:email,
        avatar: avatar?.url,
        coverImage:coverImage?.url || "",
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500,"something went wrong while creating user");
    }

    res.status(201).json(
        new ApiResponse(200,createdUser,'user created successfully')
    )
});

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();
        
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave:false})

        return {accessToken,refreshToken}
    } catch(error) {
        throw new ApiError(500,'Something went wrong while creating access and refresh tokens');
    }
}

const userLogin = asyncHandler(async (req,res) => {

    const { username,email,password } = req.body;

    if (!username && !email) {
        throw new ApiError(400,'username or email is required');
    }

    const user = await User.findOne({
        $or:[{username},{email}]
    })

    if (!user){
        throw new ApiError(404,'User doesnt exists');
    }

    const validatePassword = await user.isPasswordCorrect(password);

    if (!validatePassword) {
        throw new ApiError(404,"Invalid User Credentials");
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id)
    .select( "-password -refreshToken");

    const options = {
        httpOnly:true,
        secure:true
    }

    return res.status(201)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(
        200,
        {
            user:loggedInUser,
            refreshToken,
            accessToken
        },
        "user Logged In successfully"
    ))

});

const userLogout = asyncHandler(async (req,res) => {
    const user = req.user;

    await User.findByIdAndUpdate(
        user._id,
        {
            $set:{ refreshToken: undefined }
        },
        {
            returnDocument:'after'
        }
    )

    const options = {
        httpOnly:true,
        secure:true
    }

    res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(
        200,
        {},
        "User logged Out successfully"
    ))
})

const RefreshAccessToken = asyncHandler(async (req,res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken

    if (!incomingRefreshToken ) {
        throw new ApiError(401,"Unauthorised Request")
    }

    try {
        const decodedToken = await jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401,"Invalid Refresh Token");
        }


        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401,"Refresh token expired or invalid")
        }

        const {accessToken, refreshToken} = user.generateAccessAndRefreshToken(user._id);

        const options = {
            httpOnly:true,
            secure:true
        }

        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(new ApiResponse(201,
            {},
            "new access token generated successfully"
        ))

    } catch(error){
        throw new ApiError(401,error?.message || "Invalid access token")
    }

})

const changeCurrentPassword = asyncHandler(async (req,res) => {
    const {oldPassword,newPassword,confirmPassword} = req.body;

    if (confirmPassword !== newPassword) {
        throw new ApiError(401,"Unauthorised Request");
    }

    const user = await User.findById(req.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400,'Invalid Password');
    }

    user.password = newPassword;

    await user.save({validateBeforeSave:false});
    
    return res.status(200)
    .json(new ApiResponse(
        200,
        {},
        "password changed successfully"
    ))
})

const getCurrentUser = asyncHandler(async (req,res) => {
    return res.status(200)
    .json(
        new ApiResponse(200,req.user,"user fetched Successfully")
    )
})

const updateAccountDetails = asyncHandler(async (req,res) => {
    const {fullname,email} = req.body;

    if (!fullname && !email) {
        throw ApiError(404,"All fields are required")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{fullname,email}
        },
        {
            returnDocument:'after'
        }
    ).select(
        "-password -refreshToken"
    )

    return res.status(200)
    .json(new ApiRespose(200,user,"User updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req,res) => {
    const avatarLocalPath = req.files?.path;

    if (!avatarLocalPath) {
        throw new ApiError(404,"Avatar is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar){
        throw new  ApiError(500,'something went wrong while uploading to cloudinary')
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{avatar:avatar.url}
        }, 
        { returnDocument:"after"}
    ).select("-password -refreshToken")

    return res.status(200).json(
        new ApiResponse(200,user,"User avatar updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async (req,res) => {
    const coverImageLocalPath = req.files?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(404,"cover image is required")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage){
        throw new  ApiError(500,'something went wrong while uploading to cloudinary')
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{coverImage:coverImage.url}
        }, 
        { returnDocument:"after"}
    ).select("-password -refreshToken")

    return res.status(200).json(
        new ApiResponse(200,user,"User cover Image updated successfully")
    )
})

export {
    userRegister,
    userLogin,
    userLogout,
    RefreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserCoverImage,
    updateUserAvatar
};