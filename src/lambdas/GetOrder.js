'use strict';
const log = require("json-log").log;
const { EnvironmentCredentials } = require("aws-sdk");
const AWS = require("aws-sdk");
const DYNAMO = new AWS.DynamoDB.DocumentClient();

module.exports.handler = async event => {
  log.info(event);

  let query = event.queryStringParameters;

  if (!('id' in query)) {
    return { 
      statusCode: 400,
      body: JSON.stringify(
        {
          message: 'must specify order id',
        }
      ),
    };
  }

  const params = {
    Key: {
      "_id": query.id
    },
    TableName: process.env.ORDERS_NAME
  }

  let data;
  try {
    data = await DYNAMO.get(params).promise();
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

  log.info(data);

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        id: data.Item._id,
        email: data.Item._email,
        date: data.Item._date
      }
    ),
  };
};