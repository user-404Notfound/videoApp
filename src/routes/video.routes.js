import {Router} from 'express';
import {verifyJWT} from '../middlewares/auth.middleware.js'
import {publishVideo,getVideoById,togglePublishStatus} from '../controllers/video.controller.js'
import {upload} from '../middlewares/multer.middleware.js'

const router = Router()

router.use(verifyJWT)

router.route('/publish-video').post(
    upload.fields([
        {
            name:'video',
            maxCount:1
        },
        {
            name:'thumbnail',
            maxCount:1
        }
    ]),
    publishVideo
);

router.route("/getVideoById/:videoId").get(getVideoById);

router.route("/toggle-isPublished/:videoId").patch(togglePublishStatus)

export default router;

