import mongoose,{Schema} from 'mongoose';

const tweetSchema = new Schema(
    {
        owner:{
            type:Schema.Types.ObjectId,
            ref:'User'
        },
        content:{
            type:String,
            required:true
        }
    },
    {timestamps:true}
)

//methods add tweetSchema.methods.FunctionName = () => {} (if required in future)

export const Tweet = mongoose.model("Tweet",tweetSchema);