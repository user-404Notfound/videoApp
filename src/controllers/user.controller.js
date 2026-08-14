import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'

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

export {userRegister};