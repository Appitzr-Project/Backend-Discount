import * as express from 'express';
import { Request, Response } from 'express';
import { discountsIndex, discountStore, discountStoreValidation, discountUpdate, discountUpdateValidation, discountDelete, venueDiscountGet } from '../controller/discountController';

// Route Declare
const route = express.Router();

// Route List
route.get('/', discountsIndex);
route.post('/', discountStoreValidation, discountStore);
route.put('/:id', discountUpdateValidation, discountUpdate);
route.delete("/:id", discountDelete);
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