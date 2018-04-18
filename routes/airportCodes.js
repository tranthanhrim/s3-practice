var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
var hmacSHA256 = require('crypto-js/hmac-sha256');
var sha256 = require('crypto-js/sha256');
var base64 = require('crypto-js/enc-base64');
var hexEncode = require('crypto-js/enc-hex');
var moment = require('moment');
var fetch = require('node-fetch');

var findIndex = require('lodash/findIndex');

AWS.config.loadFromPath('./config/config.json');
var s3 = new AWS.S3();

var bucketParams = {
  Bucket: "kms-hs-production-management",
  Key: 'vendors.json',
};

// s3.createBucket({Bucket: bucketName}, function() {
//   var params = {Bucket: bucketName, Key: keyName, Body: 'Hello World!'};
//   s3.putObject(params, function(err, data) {
//     if (err)
//       console.log(err)
//     else
//       console.log("Successfully uploaded data to " + bucketName + "/" + keyName);
//   });
// });

const getAllVendors = () => {
  try {
    return new Promise((resolve, reject) => {
      s3.getObject(bucketParams, function(err, rawData) {
        if (err) {
          throw err;
        } else {
          const data = JSON.parse(rawData.Body.toString('ascii'));
          resolve(data);
        }
      });
    })
  } catch(err) {
    return err;
  }
};

const updateAllVendors = (vendors) => {
  const bufferData = new Buffer(JSON.stringify(vendors), 'binary');
  const putParams = {
    ...bucketParams,
    Body: bufferData,
  };
  try {
    return new Promise((resolve, reject) => {
      s3.putObject(putParams, function(err, data) {
        if (err) throw err;
        else resolve(data);
      });
    })
  } catch(err) {
    return err;
  }
};

router.get('/', async (req, res, next) => {
  try {
    const kSecret = 'PQlHg1M+OnKCDnaYH9W+WTkVBlhxccpZgHdcTzbi';
    const date = moment().format('YYYYMMDD');
    const region = 'ap-southeast-1';
    const signingKey = hmacSHA256(hmacSHA256(hmacSHA256(hmacSHA256("AWS4" + kSecret, date), region), 's3'),"aws4_request");
    const signatureKey = hexEncode(hmacSHA256(signingKey, 'getAirportCodes'));
    console.log('signatureKey: ', signatureKey);
    // res.send({ signingKey: sha256('') });
    return fetch('https://s3-ap-southeast-1.amazonaws.com/awss3rnd/airportCodes.csv', {
      headers: {
        'X-Amz-Date': (moment().toISOString().split('.')[0] + 'Z').replace(/[-:]/g,''),
        'X-Amz-Content-Sha256': sha256(''),
        'Authorization': 'AWS4-HMAC-SHA256 Credential=AKIAIN56YT42LHRJSFDA/20180418/ap-southeast-1/s3/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=' + signatureKey,
        'Content-Type': 'application/xml',
      },
      method: 'GET',
    }).then(response => res.send({ response }))
      .catch(error => res.send({ error }))
    // res.send({ signingKey: base64.stringify(signingKey) });
  } catch(error) {
    next(error);
  }
});

module.exports = router;
