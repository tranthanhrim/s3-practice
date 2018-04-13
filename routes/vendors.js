var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');

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
    const data = await getAllVendors();
    res.send({ data });
  } catch(error) {
    next(error);
  }
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
