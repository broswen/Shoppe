'use strict';
const log = require("json-log").log;
const { v4: uuidv4 } = require('uuid');
const AWS = require("aws-sdk");
const SNS = new AWS.SNS();
const SQS = new AWS.SQS();
const DYNAMO = new AWS.DynamoDB.DocumentClient();

module.exports.handler = async event => {
  log.info(event);

  let body;
  try {
    body = JSON.parse(event.body);
    if (!('email' in body)) {
      throw new Error('email must be included');
    }
  } catch (error) {
    return { 
      statusCode: 400,
      body: JSON.stringify(
        {
          message: error.message,
        }
      ),
    };
  }

  let _id = uuidv4();
  let _date = new Date().toISOString();
  let order = {
        id: _id,
        email: body.email,
        date: _date 
      };

  const params = {
    Item: {
      "_id": order.id,
      "_email": order.email,
      "_date": order.date
    },
    TableName: process.env.ORDERS_NAME
  }

  let data;
  try {
    data = await DYNAMO.put(params).promise()
  } catch (error) {
    return { 
      statusCode: 500,
      body: JSON.stringify(
        {
          message: error.message,
        }
      ),
    };
  }

  const params2 = {
    Message: `Your order ${order.id}, was received and is awaiting fulfillment.`,
    TopicArn: process.env.ORDERCONFIRMED_ARN
  }

  try {
    await SNS.publish(params2).promise();
  } catch (error) {
    return { 
      statusCode: 500,
      body: JSON.stringify(
        {
          message: error.message,
        }
      ),
    };
  }

  const params3 = {
    MessageBody: `New order ${order.id}.`,
    MessageAttributes: {
      "id": {
        DataType: "String",
        StringValue: order.id
      },
      "email": {
        DataType: "String",
        StringValue: order.email
      },
      "date": {
        DataType: "String",
        StringValue: order.date
      },
    },
    QueueUrl: process.env.QUEUEDORDERS_URL
  }

  try {
    await SQS.sendMessage(params3).promise();
  } catch (error) {
    return { 
      statusCode: 500,
      body: JSON.stringify(
        {
          message: error.message,
        }
      ),
    };   
  }

  return {
    statusCode: 200,
    body: JSON.stringify(order),
  };
};