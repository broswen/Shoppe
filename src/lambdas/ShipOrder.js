'use strict';
const log = require("json-log").log;
const AWS = require("aws-sdk");
const SNS = new AWS.SNS();
const DYNAMO = new AWS.DynamoDB.DocumentClient();

module.exports.handler = async event => {
  log.info(event);

  for (const record of event.Records) {
    let curDate = new Date().toISOString();
    let trackingNumber = `SH${Math.random()*10000}`;
    let date = record.messageAttributes.date.stringValue;
    let id = record.messageAttributes.id.stringValue;
    let email = record.messageAttributes.email.stringValue;

    const params = {
      Message: `Your order ${id}, has shipped! \nTracking Number: ${trackingNumber}`,
      TopicArn: process.env.ORDERSHIPPED_ARN
    }

    try {
      await SNS.publish(params).promise();
    } catch (error) {
      log.error(error);
    }

    const params2 = {
      Key: {
        "_id": id
      },
      UpdateExpression: 'set #t = :n',
      ExpressionAttributeNames: {
        '#t': '_track'
      },
      ExpressionAttributeValues: {
        ':n': trackingNumber
      },
      TableName: process.env.ORDERS_NAME
    }

    log.info(params2)

    try {
      await DYNAMO.update(params2).promise()
    } catch (error) {
      log.error(error);
    }
  }
};

