import {Router} from 'express';
import {verifyJWT} from '../middlewares/auth.middleware.js'
import {publishVideo} from '../controllers/video.controller.js'

const router = Router()

router.use(verifyJWT)

router.route('/publish-video').post(publishVideo);

export default router;

