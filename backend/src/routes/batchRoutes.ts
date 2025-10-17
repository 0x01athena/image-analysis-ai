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

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1 * 1024 * 1024, // 1MB limit
    },
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
});

// Custom middleware to handle file size errors gracefully
const handleUploadWithSizeCheck = (req: any, res: any, next: any) => {
    const uploadHandler = upload.array('images', 5000);

    uploadHandler(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                // File too large - continue with empty files array
                req.files = [];
                req.uploadErrors = req.uploadErrors || [];
                req.uploadErrors.push({
                    type: 'FILE_TOO_LARGE',
                    message: 'One or more files exceed the 1MB size limit',
                    filename: err.fieldname
                });
                return next();
            } else {
                return next(err);
            }
        }
        next();
    });
};

router.post('/upload-directory', handleUploadWithSizeCheck, batchController.uploadDirectoryImages);

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
 * /api/batch/active-sessions:
 *   get:
 *     summary: Get all active processing sessions
 *     tags: [Batch Processing]
 *     responses:
 *       200:
 *         description: Active sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       sessionId:
 *                         type: string
 *                       processingStatus:
 *                         type: object
 *       500:
 *         description: Server error
 */
router.get('/active-sessions', batchController.getActiveSessions);

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

/**
 * @swagger
 * /api/batch/products/{managementNumber}/candidate-titles:
 *   get:
 *     summary: Get candidate titles for a product
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
 *         description: Candidate titles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     managementNumber:
 *                       type: string
 *                     candidateTitles:
 *                       type: array
 *                       items:
 *                         type: string
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.get('/products/:managementNumber/candidate-titles', batchController.getCandidateTitles);

/**
 * @swagger
 * /api/batch/products/{managementNumber}/select-title:
 *   post:
 *     summary: Select a title from candidate titles
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
 *               selectedTitle:
 *                 type: string
 *                 description: The title to select from candidates
 *     responses:
 *       200:
 *         description: Title selected successfully
 *       400:
 *         description: Bad request - selectedTitle required or not in candidates
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.post('/products/:managementNumber/select-title', batchController.selectTitle);
/**
 * @swagger
 * /api/batch/products:
 *   delete:
 *     summary: Delete multiple products
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               managementNumbers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["1508260032162", "1508260032797"]
 *     responses:
 *       200:
 *         description: Products deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     deleted:
 *                       type: array
 *                       items:
 *                         type: string
 *                     failed:
 *                       type: array
 *                       items:
 *                         type: string
 *                     totalRequested:
 *                       type: number
 *                     totalDeleted:
 *                       type: number
 *                     totalFailed:
 *                       type: number
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.delete('/products', batchController.deleteMultipleProducts);

export default router;
