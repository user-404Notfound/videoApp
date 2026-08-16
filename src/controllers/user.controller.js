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
        const refreshToken = await user.generateRefeshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave:false})

        return {accessToken,refreshToken}
    } catch(error) {
        throw new ApiError(500,'Something went wrong while creating access and refresh tokens');
    }
}

const userLogin = asyncHandler(async (req,res) => {
    // get username or email and password
    // check if username or email exist
    // get user object and validate password
    // generate the access and refresh token
    // send cookies 

    const { username,email,password } = req.body;

    if (!username || !email) {
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

})
export {
    userRegister,
    userLogin
};