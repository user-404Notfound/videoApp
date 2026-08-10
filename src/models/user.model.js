import mongoose, {Schema} from 'mongoose';

const UserSchema = new Schema({
        username:{
            type:String,
            required:true,
            trim:true,
            lowercase:true,
            index:true,
            unique:true
        },
        email:{
            type:String,
            required:true,
            trim:true,
            unique:true,
            lowercase:true,
        },
        fullname:{
            type:String,
            required:true,
            index:true,
            trim:true
        },
        password:{
            type:String,
            required:[true,"Password is Required"]
        },
        avatar:{
            type:String, //cloudinary url
            required:true
        },
        coverImage:{
            type:String //cloudinary url
        },
        watchHistory:[
            {
                type:Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        refreshToken:{
            type:String,
            required:true,
            trim:true
        }
    },
    {
        timestamps:true
    }
)

export const User = mongoose.model("User",UserSchema)
