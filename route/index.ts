import * as express from 'express';
import { Request, Response } from 'express';
import { venueDiscountGet } from '../controller/discountController';

// Route Declare
const route = express.Router();

// Route Discount List Venue
route.get('/venue/:venueId', venueDiscountGet);

// health check api
route.get('/health-check', (req: Request, res: Response) => {
    return res.status(200).json({
        code: 200,
        message: 'success',
        headers: req.headers
    });
})

// export all route
export default route;