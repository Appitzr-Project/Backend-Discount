import { Response, NextFunction } from "express";
import { discountsModel } from "@appitzr-project/db-model";
import { RequestAuthenticated } from "@base-pojokan/auth-aws-cognito";
import * as AWS from 'aws-sdk';

// declare database dynamodb
const ddb = new AWS.DynamoDB.DocumentClient({ endpoint: process.env.DYNAMODB_LOCAL, convertEmptyValues: true });

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