import express from 'express';
import { check } from 'express-validator';
import userController from '../controllers/userController';

const router = express.Router();

// **************************** ADD/REMOVE FROM WATCHED MOVIES/DIARY ****************//

router.put('/:userID/add-to-diary/:movieID', userController.add_movie_to_diary);

router.put('/:userID/remove-from-diary/:movieID', userController.remove_movie_from_diary);

// ********************* WATCH LIST ADD/REMOVE MOVIE****************************** //

router.put('/:userID/add-to-watchlist/:movieID', userController.add_movie_to_watch_list);

router.put('/:userID/remove-from-watchlist/:movieID', userController.remove_movie_from_watch_list);

// ***************** EDIT BIO ****************** ///
router.put('/:id/edit-bio', [check('bio').trim().escape()], userController.edit_bio);

// ************************ FOLLOWERS ******************************** ///

router.put('/:followerID/follow/:followedUserID', userController.add_follower);

router.put('/:followerID/unfollow/:followedUserID', userController.remove_follower);

// ************************ *********** ******************************** ///

router.post(
    '/sign-up',
    [
        check('username', 'Your username should be within 3 and 15 characters long')
            .isLength({ min: 3, max: 15 })
            .trim()
            .escape(),
        check('password', 'Password must be at least 6 characters long')
            .isLength({ min: 6 })
            .trim()
            .escape(),
        check('password_confirmation', 'Passwords must match')
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            .custom((val, { req }) => val === req.body.password)
            .trim()
            .escape(),
    ],
    userController.user_sign_up,
);

router.post(
    '/log-in',
    [
        check('username', 'Your username should be within 3 and 15 characters long')
            .isLength({ min: 3, max: 15 })
            .trim()
            .escape(),
        check('password', 'Password must be at least 6 characters long')
            .isLength({ min: 6 })
            .trim()
            .escape(),
    ],
    userController.user_log_in,
);

router.get('/all', userController.get_all_users);

export default router;
