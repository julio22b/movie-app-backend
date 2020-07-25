import { Router } from 'express';
const router = Router();

router.get('/create', (req, res) => {
    res.status(200).json('hello');
});

// Export the base-router
export default router;
