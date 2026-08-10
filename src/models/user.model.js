import mongoose, {Schema} from 'mongoose';
import bcrypt from 'bcrypt';

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

UserSchema.pre("save", async function (next){
        if (!this.isModified("password")) return next();

        this.password = await bcrypt.hash(this.password,10);

        next();
    }
)

UserSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password,this.password)
}

export const User = mongoose.model("User",UserSchema)
