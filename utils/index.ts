import { body } from 'express-validator';
import {validationMessage as msg} from '@base-pojokan/express-validate-message';


export const appendValidation = (attr, validation = []) => {
    let result = body(attr);
    validation.forEach(v => {
        if(result[v]) {
            result[v]()
            if(msg[v]) {
                let message = msg[v].replace(":attribute", attr);
                result.withMessage(message)
            }
        }
    })
    return result
}

export const isIsoDate = str => {
    if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(str)) return false;
    var d = new Date(str); 
    return d.toISOString()===str;
  }