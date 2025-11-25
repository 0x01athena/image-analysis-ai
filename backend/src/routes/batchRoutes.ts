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
 *               workProcessId:
 *                 type: string
 *                 description: Work Process ID from upload-directory response
 *     responses:
 *       200:
 *         description: Batch processing started successfully
 *       400:
 *         description: No images to process or work process ID missing
 *       500:
 *         description: Server error
 */
router.post('/start-processing', batchController.startBatchProcessing);

/**
 * @swagger
 * /api/batch/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/users', batchController.getAllUsers);

/**
 * @swagger
 * /api/batch/work-process/{workProcessId}:
 *   get:
 *     summary: Get work process status by work process ID
 *     tags: [Work Process]
 *     parameters:
 *       - in: path
 *         name: workProcessId
 *         required: true
 *         schema:
 *           type: string
 *         description: Work Process ID
 *     responses:
 *       200:
 *         description: Work process status retrieved successfully
 *       404:
 *         description: Work process not found
 *       500:
 *         description: Server error
 */
router.get('/work-process/:workProcessId', batchController.getWorkProcessStatus);

/**
 * @swagger
 * /api/batch/work-process/{workProcessId}/finish:
 *   put:
 *     summary: Mark work process as finished
 *     tags: [Work Process]
 *     parameters:
 *       - in: path
 *         name: workProcessId
 *         required: true
 *         schema:
 *           type: string
 *         description: Work Process ID
 *     responses:
 *       200:
 *         description: Work process marked as finished successfully
 *       400:
 *         description: Work Process ID is required
 *       500:
 *         description: Server error
 */
router.put('/work-process/:workProcessId/finish', batchController.markWorkProcessFinished);

/**
 * @swagger
 * /api/batch/users/{userId}/work-processes:
 *   get:
 *     summary: Get active work processes for a user
 *     tags: [Work Process]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Active work processes retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/users/:userId/work-processes', batchController.getActiveWorkProcesses);

/**
 * @swagger
 * /api/batch/products/{productId}/category-list:
 *   get:
 *     summary: Get category list for a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID (management number)
 *     responses:
 *       200:
 *         description: Category list retrieved successfully
 *       400:
 *         description: Product ID is required
 *       500:
 *         description: Server error
 */
router.get('/products/:productId/category-list', batchController.getProductCategoryList);

/**
 * @swagger
 * /api/batch/categories/top-level:
 *   get:
 *     summary: Get top-level categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Top-level categories retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/categories/top-level', batchController.getTopLevelCategories);

/**
 * @swagger
 * /api/batch/categories/level/{level}:
 *   post:
 *     summary: Get categories by level
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: level
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category level (2-8)
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *                 description: Parent category
 *               category2:
 *                 type: string
 *                 description: Parent category2
 *               category3:
 *                 type: string
 *                 description: Parent category3
 *               category4:
 *                 type: string
 *                 description: Parent category4
 *               category5:
 *                 type: string
 *                 description: Parent category5
 *               category6:
 *                 type: string
 *                 description: Parent category6
 *               category7:
 *                 type: string
 *                 description: Parent category7
 *               productId:
 *                 type: string
 *                 description: Product ID (management number)
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *       400:
 *         description: Invalid level
 *       500:
 *         description: Server error
 */
router.post('/categories/level/:level', batchController.getCategoriesByLevel);


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

/**
 * @swagger
 * /api/batch/excel/export:
 *   get:
 *     summary: Export updated Excel file with 管理番号 and 色 columns updated
 *     tags: [Batch]
 *     responses:
 *       200:
 *         description: Excel file downloaded successfully
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       500:
 *         description: Server error
 */
router.get('/excel/export', batchController.exportExcelFile);

export default router;
