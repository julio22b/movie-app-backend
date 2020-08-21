import express from 'express';
import { check } from 'express-validator';
import reviewController from '../controllers/reviewController';
import passport from 'passport';

const router = express.Router();

router.get('/:id', reviewController.get_one_review);

router.get(
    '/:userID/friends',
    passport.authenticate('jwt', { session: false }),
    reviewController.get_reviews_by_friends,
);

router.get('/all/latest', reviewController.get_latest_reviews);

router.delete(
    '/:id',
    passport.authenticate('jwt', { session: false }),
    reviewController.delete_review,
);

router.put(
    '/:userID/like/:reviewID',
    passport.authenticate('jwt', { session: false }),
    reviewController.like_review,
);

router.put(
    '/:id/edit',
    passport.authenticate('jwt', { session: false }),
    [check('content').trim().escape(), check('rating').isNumeric().trim().escape()],
    reviewController.edit_review,
);

router.post(
    '/:userID/comment/:reviewID',
    passport.authenticate('jwt', { session: false }),
    [check('content', 'Enter a valid comment').isLength({ min: 1, max: 500 }).trim().escape()],
    reviewController.post_comment,
);

router.post(
    '/:movieID/:userID/create',
    passport.authenticate('jwt', { session: false }),
    [
        check('content', 'Enter a valid comment').trim().escape(),
        check('rating').isNumeric().trim().escape(),
    ],
    reviewController.post_review,
);

router.get('/all', reviewController.get_all_reviews);

export default router;
