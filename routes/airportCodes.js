var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
var moment = require('moment');
var fetch = require('node-fetch');
var Sign = require('aws-signer-v4');
var https = require('https');
var aws4  = require('aws4');

const credentials = {
  accessKeyId: 'AKIAJVLIZMD2EMKHSJJA',
  secretAccessKey: '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',
  region: 'ap-southeast-1',
};

router.get('/', async (req, res, next) => {
  // req is IncomingMessage, we need an HttpRequest instance
  try {
    const dateTime = (moment().toISOString().split('.')[0] + 'Z').replace(/[-:]/g,'');
    const date = moment().format('YYYYMMDD');
    const path = './vendors.json';
    // const request = {
    //   headers: {
    //     'content-type': 'application/x-www-form-urlencoded',
    //     'host': 'awss3rnd.s3.amazonaws.com',
    //     'x-amz-content-sha256': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    //     'x-amz-date': dateTime,
    //   },
    //   region: 'ap-southeast-1',
    //   path,
    //   pathname: () => {
    //     return path;
    //   },
    //   search: () => {
    //     return '';
    //   },
    //   method: 'GET',
    // };
    //
    // const v4 = new AWS.Signers.V4(request, 's3');
    // v4.addAuthorization(credentials, new Date());

    // const signatureV4 = v4.signature(credentials, dateTime);
    // const credential = `${credentials.accessKeyId}/${date}/ap-southeast-1/s3/aws4_request`;
    // const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
    // const content = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    // const auth = `AWS4-HMAC-SHA256 Credential=${credential}, SignedHeaders=${signedHeaders}, Signature=${signatureV4}`;
    // const headers = {
    //   'Content-Type': 'application/x-www-form-urlencoded',
    //   'Authorization': v4.authorization(credentials, dateTime),
    //   'X-Amz-Content-Sha256': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    //   'X-Amz-Date': dateTime,
    // };
    // return fetch('https://s3-ap-southeast-1.amazonaws.com/awss3rnd/airportCodes.csv', {
    //   headers,
    //   method: 'GET',
    // }).then(response => {
    //   console.log('response: ', response);
    //   return response.text();
    // }).then(json => res.send({ data: json }))
    //   .catch(error => {
    //     console.log('error: ', error);
    //     return res.send({error});
    //   })

    const request = {
      body: '',
      headers: {
        Date: new Date().toISOString(),
        Host: 's3.ap-southeast-1.amazonaws.com'
      },
      method: 'GET',
      url: 'https://s3.ap-southeast-1.amazonaws.com'
    };

    const sign = new Sign({
      accessKeyId: credentials.accessKeyId,
      body: request.body,
      headers: request.headers,
      method: 'GET',
      region: credentials.region,
      secretAccessKey: credentials.secretAccessKey,
      url: request.url
    });
    const splitSigns = sign.toString().split(', ');
    const newSign = splitSigns[0] + ', SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, ' + splitSigns[2];
    console.log('newSign: ', newSign);

    return fetch('https://s3-ap-southeast-1.amazonaws.com/awss3rnd/vendors.json', {
      headers: {
        Authorization: newSign,
        'X-Amz-Date': dateTime,
        'X-Amz-Content-Sha256': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      },
      method: 'GET',
    }).then(response => {
      console.log('response: ', response);
      return response.text();
    }).then(json => res.send({ data: json }))
      .catch(error => {
        console.log('error: ', error);
        return res.send({error});
      })
  } catch(error) {
    next(error);
  }
});

router.get('/hand-calc', async (req, res, next) => {
  // req is IncomingMessage, we need an HttpRequest instance
  try {
    const dateTime = (moment().toISOString().split('.')[0] + 'Z').replace(/[-:]/g,'');
    const date = moment().format('YYYYMMDD');
    const path = './vendors.json';
    const request = {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'host': 's3.ap-southeast-1.amazonaws.com',
        'x-amz-content-sha256': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        'x-amz-date': dateTime,
      },
      region: 'ap-southeast-1',
      path,
      pathname: () => {
        return path;
      },
      search: () => {
        return '';
      },
      method: 'GET',
    };

    const v4 = new AWS.Signers.V4(request, 's3');
    v4.addAuthorization(credentials, new Date());

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': v4.authorization(credentials, dateTime),
      'X-Amz-Content-Sha256': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      'X-Amz-Date': dateTime,
    };

    return fetch('https://s3-ap-southeast-1.amazonaws.com/awss3rnd/airportCodes.csv', {
      headers,
      method: 'GET',
    }).then(response => {
      console.log('response: ', response);
      return response.text();
    }).then(json => res.send({ data: json }))
      .catch(error => {
        console.log('error: ', error);
        return res.send({error});
      })
  } catch(error) {
    next(error);
  }
});

function request(o) { https.request(o, function(res) { res.pipe(process.stdout) }).end(o.body || '') }

router.get('/aws4', async (req, res, next) => {
  try {
    request(aws4.sign(
      {
        service: 's3',
        path: '/awss3rnd/vendors.json',
        hostname: 's3.ap-southeast-1.amazonaws.com',
      },
      credentials
    ))
  } catch(error) {
    next(error);
  }
});

module.exports = router;
