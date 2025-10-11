import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { batchController } from '../controllers/batchController';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../public/images');
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: Session ID from upload-directory response
 *     responses:
 *       200:
 *         description: Batch processing started successfully
 *       400:
 *         description: No images to process or session ID missing
 *       500:
 *         description: Server error
 */
router.post('/start-processing', batchController.startBatchProcessing);

/**
 * @swagger
 * /api/batch/status/{sessionId}:
 *   get:
 *     summary: Get processing status for a session
 *     tags: [Batch Processing]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Processing status retrieved successfully
 *       404:
 *         description: Session not found or expired
 *       500:
 *         description: Server error
 */
router.get('/status/:sessionId', batchController.getProcessingStatus);

/**
 * @swagger
 * /api/batch/results/{sessionId}:
 *   get:
 *     summary: Get processing results for a session
 *     tags: [Batch Processing]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Processing results retrieved successfully
 *       404:
 *         description: Session not found or expired
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/batch/results/{sessionId}:
 *   get:
 *     summary: Get processing results for a session
 *     tags: [Batch Processing]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Processing results retrieved successfully
 *       404:
 *         description: Session not found or expired
 *       500:
 *         description: Server error
 */
router.get('/results/:sessionId', batchController.getProcessingResults);

/**
 * @swagger
 * /api/batch/products:
 *   get:
 *     summary: Get all products with pagination and filtering
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Items per page
 *       - in: query
 *         name: rank
 *         schema:
 *           type: string
 *           enum: [A, B, C]
 *         description: Filter by generation rank
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by creation date
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/products', batchController.getAllProducts);

/**
 * @swagger
 * /api/batch/products/{managementNumber}:
 *   get:
 *     summary: Get single product by management number
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: managementNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Product management number
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: managementNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Product management number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               level:
 *                 type: string
 *               measurement:
 *                 type: string
 *               condition:
 *                 type: string
 *               category:
 *                 type: string
 *               shop1:
 *                 type: string
 *               shop2:
 *                 type: string
 *               shop3:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: managementNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Product management number
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.get('/products/:managementNumber', batchController.getProduct);
router.put('/products/:managementNumber', batchController.updateProduct);
router.delete('/products/:managementNumber', batchController.deleteProduct);

export default router;
