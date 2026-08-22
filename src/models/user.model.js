import mongoose, {Schema} from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userSchema = new Schema({
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
            url: {
                type:String, //cloudinary url
                required:true
            },
            public_id : {
                type:String,
                required:true
            }
        },
        coverImage:{
            url: {
                type:String, //cloudinary url
            },
            public_id : {
                type:String,
            }
        },
        watchHistory:[
            {
                type:Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        refreshToken:{
            type:String,
            trim:true
        }
    },
    {
        timestamps:true
    }
)

userSchema.pre("save", async function (){
    
        if (!this.isModified("password")) return;

        this.password = await bcrypt.hash(this.password,10);
    }
)

userSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken =  function (){
    return  jwt.sign(
        {
            _id:this._id,
            username:this.username,
            email:this.email,
            fullname:this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken =  function (){
    return  jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User",userSchema)
