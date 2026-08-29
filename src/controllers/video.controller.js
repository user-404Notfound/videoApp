import {ApiError} from '../utils/ApiError.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import {asyncHandler} from '../utils/asyncHandler.js'
import {uploadOnCloudinary,deleteOnCloudinary} from '../utils/cloudinary.js'
import {Video} from '../models/video.model.js'

const publishVideo = asyncHandler(async (req,res) => {
    const { title,description } = req.body;

    if ([title,description].some((field) => {
        return field.trim() === "";
    })) {
        throw new ApiError(400,"Title and description of video is required")
    }

    const videoLocalPath = req.files?.video?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

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

const getVideoById = asyncHandler(async (req,res) => {
    const {videoId} = req.params
    
    const video = await Video.findById(videoId).populate("owner","username fullname avatar.url")

    if (!video){
        throw new ApiError(404,"Video not found")
    }

    if (!video.isPublished) {
        throw new ApiError(403,"video is private")
    }

    return res.status(200)
    .json(new ApiResponse(200,video,"video details fetched successfully"))

})

const togglePublishStatus = asyncHandler(async (req,res) => {
    const {videoId} = req.params

    const video = await Video.findById(videoId);

    if (!video){
        throw new ApiError(404,"video not found")
    }

    if (video.owner.toString() !== req.user?.id) {
        throw new ApiError(403,"Unauthorised Request")
    }

    video.isPublished = !video.isPublished

    await video.save({validateBeforeSave:false});
    
    res.status(200)
    .json(new ApiResponse(200,{isPublished:video.isPublished},"Publish status changed successfully"))
})

const updateVideo = asyncHandler(async (req,res) => {
    const {videoId} = req.params
    const {title,description} = req.body

    const thumbnailLocalPath = req.file?.path;

    if (!title && !description && !thumbnailLocalPath){
        throw new ApiError(400,"At least one field is required to update video")
    }
    
    const video = await Video.findById(videoId);

    if (!video){
        throw new ApiError(404,"Video not found")
    }

    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403,"Unauthorised Request")
    }

    const oldthumbnail = video.thumbnail;

    let thumbnail;

    if (thumbnailLocalPath){
        thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
        if (!thumbnail){
            throw new ApiError(500,'Something went wrong while uploading to cloudinary')
        }
    }


    if (title?.trim()){
        video.title = title.trim()
    }

    if (description?.trim()) {
        video.description = description.trim()
    }

    if (thumbnailLocalPath) {
        video.thumbnail = { url:thumbnail?.secure_url, public_id:thumbnail?.public_id}
    }
    

    let updatedVideo;
    try {
        updatedVideo = await video.save();
        updatedVideo = updatedVideo.toObject();
        
    } catch (error){
       
        if (thumbnail) {
            await deleteOnCloudinary(thumbnail.public_id)
        }

       throw new ApiError(500,'Something went wrong while saving database')
    }
    if (oldthumbnail && thumbnail?.public_id) {
        await deleteOnCloudinary(oldthumbnail.public_id);
    }

    return res.status(200)
    .json(new ApiResponse(200,
       updatedVideo
    ,"video updated successfully"))
})


export{ publishVideo,
        getVideoById,
        togglePublishStatus,
        updateVideo
    };