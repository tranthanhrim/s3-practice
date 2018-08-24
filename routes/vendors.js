var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');

var findIndex = require('lodash/findIndex');

AWS.config.loadFromPath('./config/config.json');
var s3 = new AWS.S3();
var sns = new AWS.SNS();

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
  sns.getTopicAttributes({ TopicArn: 'arn:aws:sns:ap-southeast-1:472377328078:mir-topic' }, (err, result) => {
    console.log(err, result);
  });
  // try {
  //   const data = '50 4f 53 54 0a 2f 61 77 73 73 33 72 6e 64 2f 64 61 74 61 2e 6a 73 6f 6e 0a 73 65 6c 65 63 74 3d 26 73 65 6c 65 63 74 2d 74 79 70 65 3d 32 0a 63 6f 6e 74 65 6e 74 2d 6c 65 6e 67 74 68 3a 35 37 38 0a 63 6f 6e 74 65 6e 74 2d 74 79 70 65 3a 61 70 70 6c 69 63 61 74 69 6f 6e 2f 78 6d 6c 0a 68 6f 73 74 3a 73 33 2d 61 70 2d 73 6f 75 74 68 65 61 73 74 2d 31 2e 61 6d 61 7a 6f 6e 61 77 73 2e 63 6f 6d 0a 78 2d 61 6d 7a 2d 63 6f 6e 74 65 6e 74 2d 73 68 61 32 35 36 3a 63 33 64 66 33 37 38 31 65 33 63 38 34 35 64 31 62 35 34 35 37 65 37 31 33 31 62 65 39 38 34 30 38 62 66 35 65 38 37 36 34 36 31 32 61 62 65 63 61 63 32 33 30 32 39 38 35 63 61 65 34 32 34 32 0a 78 2d 61 6d 7a 2d 64 61 74 65 3a 32 30 31 38 30 34 31 37 54 30 39 31 36 30 37 5a 0a 0a 63 6f 6e 74 65 6e 74 2d 6c 65 6e 67 74 68 3b 63 6f 6e 74 65 6e 74 2d 74 79 70 65 3b 68 6f 73 74 3b 78 2d 61 6d 7a 2d 63 6f 6e 74 65 6e 74 2d 73 68 61 32 35 36 3b 78 2d 61 6d 7a 2d 64 61 74 65 0a 63 33 64 66 33 37 38 31 65 33 63 38 34 35 64 31 62 35 34 35 37 65 37 31 33 31 62 65 39 38 34 30 38 62 66 35 65 38 37 36 34 36 31 32 61 62 65 63 61 63 32 33 30 32 39 38 35 63 61 65 34 32 34 32';
  //   const dataBuffer = new Buffer(data, 'binary');
  //   console.log('dataBuffer: ', dataBuffer);
  //   console.log(dataBuffer.toString('ascii'));
  //   s3.getObject(bucketParams, function(err, data) {
  //     if (err) console.log(err, err.stack); // an error occurred
  //     else     res.send({ data });           // successful response
  //   });
  // } catch(error) {
  //   next(error);
  // }
});

router.post('/', async (req, res, next) => {
  try {
    const data = await getAllVendors();
    data.push(req.body);
    const response = await updateAllVendors(data);
    res.send({ response });
  } catch(error) {
    next(error);
  }
});

router.patch('/:vendorId', async (req, res, next) => {
  try {
    const data = await getAllVendors();
    let itemIndex = findIndex(data, { id: req.params.vendorId });
    data[itemIndex] = Object.assign(data[itemIndex], req.body);
    const response = await updateAllVendors(data);
    res.send({ response: req.params.vendorId });
  } catch(error) {
    next(error);
  }
});

router.delete('/:vendorId', async (req, res, next) => {
  try {
    const data = await getAllVendors();
    let itemIndex = findIndex(data, { id: req.params.vendorId });
    data.splice(itemIndex,1);
    const response = await updateAllVendors(data);
    res.send({ response: req.params.vendorId });
  } catch(error) {
    next(error);
  }
});

module.exports = router;
