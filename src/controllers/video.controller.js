import {ApiError} from '../utils/ApiError.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import {asyncHandler} from '../utils/asyncHandler.js'
import {uploadOnCloudinary,deleteOnCloudinary} from '../utils/cloduinary.js'
import {Video} from '../models/video.model.js'


const publishVideo = asyncHandler(async (req,res) => {
    const { title,description } = req.body;

    if ([title,description].some((field) => {
        return field.trim() === "";
    })) {
        throw new ApiError(400,"Title and description of video is required")
    }

    const videoLocalPath = req.file?.video?.[0]?.path;
    const thumbnailLocalPath = req.file?.thumbnail?.[0]?.path;

    const video = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!(video && thumbnail )) {
        await deleteOnCloudinary(video?.public_id)
        await deleteOnCloudinary(thumbnail?.public_id)
        throw new ApiError(500,'something went wrong while uploading video or thumbnail on cloudinary');
    }

    const publishedVideo = await Video.create({
        thumbnail:{
            url:thumbnail?.secure_url,
            public_id:thumbnail?.public_id
        },
        videoFile:{
            url:video?.secure_url,
            public_id:video?.public_id
        },
        title:title,
        description:description,
        owner: req.user?._id,
        duration:video?.duration
    })
    if (!publishedVideo){
        await deleteOnCloudinary(video?.public_id)
        await deleteOnCloudinary(thumbnail?.public_id)
        throw new ApiError(500,"Something went wrong while saving to database")
    }
    return res.status(201)
    .json(new ApiResponse(201,publishedVideo,"Video published successfully"))

})

export {publishVideo};