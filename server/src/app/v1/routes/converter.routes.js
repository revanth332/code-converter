
import { upload, convertCode, downloadCode,extractZip,updateCode } from '../controllers/converter.controller.js'
import express from 'express'
const router = express.Router();

router.route('/extract')
    .post(upload.single('file'),extractZip);

router.route('/convert')
    .post(convertCode);

router.route('/update')
    .post(updateCode);

router.route('/convert/download')
    .post(downloadCode);

export default router;