import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { batchController } from '../controllers/batchController';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads/images');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Keep original filename for product grouping
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|bmp|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit per file
    }
});

/**
 * @swagger
 * /api/batch/upload-directory:
 *   post:
 *     summary: Upload images from directory
 *     tags: [Batch Processing]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/upload-directory', upload.array('images', 5000), batchController.uploadDirectoryImages);

/**
 * @swagger
 * /api/batch/start-processing:
 *   post:
 *     summary: Start batch processing for uploaded images
 *     tags: [Batch Processing]
 *     responses:
 *       200:
 *         description: Batch processing started successfully
 *       400:
 *         description: No images to process
 *       500:
 *         description: Server error
 */
router.post('/start-processing', batchController.startBatchProcessing);

/**
 * @swagger
 * /api/batch/status:
 *   get:
 *     summary: Get batch processing status
 *     tags: [Batch Processing]
 *     responses:
 *       200:
 *         description: Current processing status
 */
router.get('/status', batchController.getProcessingStatus);

/**
 * @swagger
 * /api/batch/results:
 *   get:
 *     summary: Get batch processing results
 *     tags: [Batch Processing]
 *     responses:
 *       200:
 *         description: Processing results
 */
router.get('/results', batchController.getProcessingResults);

export default router;
