import * as express from 'express';
import { Request, Response } from 'express';
import { profileIndex } from '../controller/profileController';
import { discounteGet } from '../controller/discountController';

// Route Declare
const route = express.Router();

// Route List
route.get('/', profileIndex);

// Route Discount List
route.get('/venue', discounteGet);

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