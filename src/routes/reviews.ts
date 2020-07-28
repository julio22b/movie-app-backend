import express from 'express';
import { check } from 'express-validator';
import reviewController from '../controllers/reviewController';

const router = express.Router();

router.delete('/:id', reviewController.delete_review);

router.put('/:id/like', reviewController.like_review);

router.put(
    '/:id/edit',
    [check('content').trim().escape(), check('rating').isNumeric().trim().escape()],
    reviewController.edit_review,
);

router.post(
    '/:movieID/:userID/create',
    [check('content').trim().escape(), check('rating').isNumeric().trim().escape()],
    reviewController.post_review,
);

router.get('/all', reviewController.get_all_reviews);

export default router;
