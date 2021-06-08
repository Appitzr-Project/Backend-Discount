import { Response, NextFunction } from "express";
import { discountsModel, venueProfileModel, discounts } from "@appitzr-project/db-model";
import { validationResult, ValidationChain} from 'express-validator';
import { RequestAuthenticated, validateGroup } from "@base-pojokan/auth-aws-cognito";
import * as AWS from 'aws-sdk';
import {v4 as uuidv4} from "uuid";
import {appendValidation, isIsoDate} from '../utils';

// declare database dynamodb
const ddb = new AWS.DynamoDB.DocumentClient({ endpoint: process.env.DYNAMODB_LOCAL, convertEmptyValues: true });

export const discountStoreValidation : ValidationChain[] = [
  appendValidation("voucherCode", ["notEmpty"]),
  appendValidation("percentage", ["notEmpty"]).isInt({min: 1, max: 100}).withMessage("Percentage must contain a minimum of 1 and maximum of 100"),
  appendValidation("minOrder", ["notEmpty", "isInt"]),
  appendValidation("maxDiscAmount", ["notEmpty", "isInt"]),
  appendValidation("isActive", ["notEmpty", "isBoolean"]),
  appendValidation("startDate", ["notEmpty"]).custom(v => {
    if(isIsoDate(v)) {
      return true;
    } else {
      throw new Error('startDate must be ISO String Date');
    }
  }),
  appendValidation("endDate", ["notEmpty"]).custom(v => {
    if(isIsoDate(v)) {
      return true;
    } else {
      throw new Error('startDate must be ISO String Date');
    }
  })
]

export const discountUpdateValidation : ValidationChain[] = [
  appendValidation("voucherCode", ["notEmpty"]),
  appendValidation("percentage", ["notEmpty"]).isInt({min: 1, max: 100}).withMessage("Percentage must contain a minimum of 1 and maximum of 100"),
  appendValidation("minOrder", ["notEmpty", "isInt"]),
  appendValidation("maxDiscAmount", ["notEmpty", "isInt"]),
  appendValidation("isActive", ["notEmpty", "isBoolean"]),
  appendValidation("startDate", ["notEmpty"]).custom(v => {
    if(isIsoDate(v)) {
      return true;
    } else {
      throw new Error('startDate must be ISO String Date');
    }
  }),
  appendValidation("endDate", ["notEmpty"]).custom(v => {
    if(isIsoDate(v)) {
      return true;
    } else {
      throw new Error('startDate must be ISO String Date');
    }
  })
]

const queryUser = async req => {
  try {
    // validate group
    const user = await validateGroup(req, "venue");

    // Get Venue Id \\
    // dynamodb parameter
    const paramUser : AWS.DynamoDB.DocumentClient.GetItemInput = {
      TableName: venueProfileModel.TableName,
      Key: {
        venueEmail: user.email,
        cognitoId: user.sub
      },
      AttributesToGet: ["id"]
    }

    // query to database
    return await ddb.get(paramUser).promise();
  } catch (error) {
    return error;
  }
}

/**
 * Index Data Function
 *
 * @param req
 * @param res
 * @param next
 */
export const discountsIndex = async (
  req: RequestAuthenticated,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await queryUser(req);
    if(!user.Item?.id) {
      return res.send({
        code: 404,
        message: "User Not Found"
      })
    }

    // dynamodb parameter
    const paramDiscounts : AWS.DynamoDB.QueryInput = {
      TableName: discountsModel.TableName,
      IndexName: "venueIdIndex",
      KeyConditionExpression: "#id = :id",
      ExpressionAttributeNames: {
        "#id" : "venueId"
      },
      ExpressionAttributeValues: {
        ":id" : user?.Item?.id
      },
      
    }

    const queryDiscounts = await ddb.query(paramDiscounts).promise();

    // return response
    return res.json({
      code: 200,
      message: "success",
      data: queryDiscounts?.Items,
    });
  } catch (e) {
    next(e);
  }
};

/**
 * store Data Function
 *
 * @param req
 * @param res
 * @param next
 */
export const discountStore =async (
  req: RequestAuthenticated,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await queryUser(req);
    if(!user.Item?.id) {
      return res.send({
        code: 404,
        message: "User Not Found"
      })
    }

    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const data : discounts = req.body;

    const paramCheck: AWS.DynamoDB.DocumentClient.QueryInput = {
      TableName: discountsModel.TableName,
      IndexName: "voucherCodeIndex",
      KeyConditionExpression: "#voucher = :voucher",
      ExpressionAttributeNames: {
        "#voucher" : "voucherCode"
      },
      ExpressionAttributeValues : {
        ":voucher" : data.voucherCode
      }
    }

    let paramQuery = await ddb.query(paramCheck).promise();

    if(paramQuery?.Items?.length > 0) {
      return res.send({
        code: 500,
        message: "voucherCode Already Exist!"
      })
    } 

    const dataInput: discounts = {
      id: uuidv4(),
      venueId: user.Item.id,
      voucherCode: data.voucherCode,
      percentage: data.percentage,
      minOrder: data.minOrder,
      maxDiscAmount: data.maxDiscAmount,
      isActive: data.isActive,
      startDate: data.startDate,
      endDate: data.endDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const paramsDB: AWS.DynamoDB.DocumentClient.PutItemInput = {
      TableName: discountsModel.TableName,
      Item: dataInput,
      ConditionExpression : `attribute_not_exists(voucherCode)`
    }

    await ddb.put(paramsDB).promise();

    res.send({
      code: 200,
      data: paramsDB?.Item,
      message: 'success',
    })
  } catch (error) {
    if (error?.code == 'ConditionalCheckFailedException') {
      next(new Error('Data Already Exist.!'));
    }

    next(error);
  }
}


/**
 * store Data Function
 *
 * @param req
 * @param res
 * @param next
 */
export const discountUpdate = async (
  req: RequestAuthenticated,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await queryUser(req);
    if(!user.Item?.id) {
      return res.send({
        code: 404,
        message: "User Not Found"
      })
    }

    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const data : discounts = req.body;
    const {id} = req.params

    const paramsDB : AWS.DynamoDB.DocumentClient.UpdateItemInput = {
      TableName: discountsModel.TableName,
      Key: {
        id,
        venueId : user.Item.id
      },
      UpdateExpression: `
        set
        maxDiscAmount = :md,
        voucherCode   = :vd,
        percentage    = :p,
        minOrder      = :mo,
        isActive      = :ia,
        startDate     = :sd,
        endDate       = :ed,
        updatedAt     = :ua
      `,
      ExpressionAttributeValues: {
        ":vd" : data.voucherCode,
        ":p"  : data.percentage,
        ":mo" : data.minOrder,
        ":md" : data.maxDiscAmount,
        ":ia" : data.isActive,
        ":sd" : data.startDate,
        ":ed" : data.endDate,
        ":ua"  : new Date().toISOString()
      },
      ReturnValues: 'UPDATED_NEW',
      ConditionExpression: 'attribute_exists(id)'
    }

    const queryDB = await ddb.update(paramsDB).promise();

    return res.send({
      code: 200,
      data: queryDB?.Attributes,
      message: 'success',
    })
  } catch (error) {
    if (error?.code == 'ConditionalCheckFailedException') {
      return next(new Error('Data Not Exist.!'));
    }
    return next(error);
  }
}

/**
 * store Data Function
 *
 * @param req
 * @param res
 * @param next
 */
export const discountDelete = async (
  req: RequestAuthenticated,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await queryUser(req);
    if(!user.Item?.id) {
      return res.send({
        code: 404,
        message: "User Not Found"
      })
    }
    const {id} = req.params;

    const paramsDB : AWS.DynamoDB.DocumentClient.DeleteItemInput = {
      TableName: discountsModel.TableName,
      Key: {
        id,
        venueId: user.Item.id
      },
      ConditionExpression: "attribute_exists(id)"
    }

    await ddb.delete(paramsDB).promise();

        // return result
    return res.status(200).json({
        code: 200,
        message: 'success'
    });
  } catch (error) {
    if (error?.code == 'ConditionalCheckFailedException') {
      return next(new Error('Data Not Exist.!'));
    }
    return next(error);
  }
}
export const venueDiscountGet = async (
    req: RequestAuthenticated,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const {venueId} = req.params;

      // return result
      const params = { 
        TableName: discountsModel.TableName,
        IndexName: "venueIdIndex",
        KeyConditionExpression: "#venueId = :venueId",
        ExpressionAttributeNames: {
          "#venueId" : "venueId"
        },
        ExpressionAttributeValues: {
          ":venueId" : venueId
        },
      };

      const queryDB = await ddb.query(params).promise();
  
      // return result
      return res.status(200).json({
        code: 200,
        message: 'success',
        data: queryDB?.Items
    });

    } catch (e) {
      // return default error
      next(e);
    }
  };
