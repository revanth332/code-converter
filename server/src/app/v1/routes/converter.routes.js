
import { upload, convertCode, downloadCode,extractZip,updateCode,enhanceQuery, applyCode,runCode, stopCode } from '../controllers/converter.controller.js'
import express from 'express'
const router = express.Router();

router.route('/extract')
    .post(upload.single('file'),extractZip);

router.route('/convert')
    .post(convertCode);

router.route('/update')
    .post(upload.single('file'),updateCode);

router.route('/enhance')
    .post(enhanceQuery);

router.route('/apply/local')
    .post(applyCode);

router.route('/code/run')
    .post(runCode);

router.route('/code/stop')
    .get(stopCode);

router.route('/convert/download')
    .post(downloadCode);

export default router;