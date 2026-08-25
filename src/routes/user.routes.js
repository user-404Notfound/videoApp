import {Router} from 'express';
import {userRegister,userLogin,userLogout,RefreshAccessToken,getCurrentUser,getUserChannelProfile} from '../controllers/user.controller.js'
import {updateAccountDetails,changeCurrentPassword, updateUserAvatar,updateUserCoverImage} from '../controllers/user.controller.js';
import {upload} from '../middlewares/multer.middleware.js'
import {verifyJWT} from "../middlewares/auth.middleware.js"


const router = Router();

router.route('/register').post(upload.fields([
        {
            name:'avatar',
            maxCount:1
        },
        {
            name:'coverImage',
            maxCount:1
        }
    ]),
    userRegister
);

router.route("/login").post(upload.none(),userLogin)

router.route("/logout").post(verifyJWT,userLogout)

router.route("/refresh-token").post(RefreshAccessToken)

router.route("/change-password").post(verifyJWT,upload.none(),changeCurrentPassword)

router.route("/get-user").post(verifyJWT,getCurrentUser)

router.route("/update-account").post(verifyJWT,upload.none(),updateAccountDetails)

router.route("/update-avatar").post(upload.single("avatar"),verifyJWT,updateUserAvatar)

router.route("/update-coverImage").post(upload.single("coverImage"),verifyJWT,updateUserCoverImage)

router.route("/getChannelProfile").post(getUserChannelProfile)

export default router;