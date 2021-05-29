import { Response, NextFunction } from "express";
import { discountsModel } from "@appitzr-project/db-model";
import { RequestAuthenticated } from "@base-pojokan/auth-aws-cognito";
import * as AWS from 'aws-sdk';

// declare database dynamodb
const ddb = new AWS.DynamoDB.DocumentClient({ endpoint: process.env.DYNAMODB_LOCAL, convertEmptyValues: true });

export const discounteGet = async (
    req: RequestAuthenticated,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // return result
      const params = { 
        TableName: discountsModel.TableName
      };

      const queryDB = await ddb.scan(params).promise();
  
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