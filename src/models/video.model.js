import mongoose,{Schema} from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const VideoSchema = new Schema({
        videoFile:{
            url:{
                type:String,
                required:true
            },
            public_id:{
                type:String,
                required:true
            }
        },
        tumbnail:{
            url:{
                type:String,
                required:true
            },
            public_id:{
                type:String,
                required:true
            }
        },
        title:{
            type:String,
            required:true
        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User"
        },
        duration:{
            type:Number,
            required:true
        },
        description:{
            type:String,
            required:true
        },
        views:{
            type:Number,
            default:0
        },
        isPublished:{
            type:Boolean,
            default:true
        }
    },
    {
        timestamps:true
    }
)

VideoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video",VideoSchema)