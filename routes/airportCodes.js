var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
var moment = require('moment');
var fetch = require('node-fetch');

const stringToSign = (request) => {
  var r = request;

  var parts = [];
  parts.push(r.method);
  parts.push(r.headers['Content-MD5'] || '');
  parts.push(r.headers['Content-Type'] || '');

  // This is the "Date" header, but we use X-Amz-Date.
  // The S3 signing mechanism requires us to pass an empty
  // string for this Date header regardless.
  parts.push(r.headers['presigned-expires'] || '');

  var headers = canonicalizedAmzHeaders(request);
  if (headers) parts.push(headers);
  parts.push(canonicalizedResource(request));

  return parts.join('\n');

};

const canonicalizedAmzHeaders = (request) => {

  var amzHeaders = [];

  AWS.util.each(request.headers, function (name) {
    if (name.match(/^x-amz-/i))
      amzHeaders.push(name);
  });

  amzHeaders.sort(function (a, b) {
    return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
  });

  var parts = [];
  AWS.util.arrayEach.call(this, amzHeaders, function (name) {
    parts.push(name.toLowerCase() + ':' + String(request.headers[name]));
  });

  return parts.join('\n');

};

const canonicalizedResource = (request) => {

  var r = request;

  var parts = r.path.split('?');
  var path = parts[0];
  var querystring = parts[1];

  var resource = '';

  if (r.virtualHostedBucket)
    resource += '/' + r.virtualHostedBucket;

  resource += path;

  if (querystring) {

    // collect a list of sub resources and query params that need to be signed
    var resources = [];

    AWS.util.arrayEach.call(this, querystring.split('&'), function (param) {
      var name = param.split('=')[0];
      var value = param.split('=')[1];
      if (this.subResources[name] || this.responseHeaders[name]) {
        var subresource = { name: name };
        if (value !== undefined) {
          if (this.subResources[name]) {
            subresource.value = value;
          } else {
            subresource.value = decodeURIComponent(value);
          }
        }
        resources.push(subresource);
      }
    });

    resources.sort(function (a, b) { return a.name < b.name ? -1 : 1; });

    if (resources.length) {

      querystring = [];
      AWS.util.arrayEach(resources, function (res) {
        if (res.value === undefined) {
          querystring.push(res.name);
        } else {
          querystring.push(res.name + '=' + res.value);
        }
      });

      resource += '?' + querystring.join('&');
    }

  }

  return resource;
};

router.get('/', async (req, res, next) => {
  // req is IncomingMessage, we need an HttpRequest instance
  try {
    const credentials = {
      accessKeyId: 'AKIAIY6EW7RYBZLFFJGA',
      secretAccessKey: 'cIwtdr45YiP3obKuY3EHyPlwMwzQAYB/lhtSW0Qt',
      region: 'ap-southeast-1',
    };
    const dateTime = (moment().toISOString().split('.')[0] + 'Z').replace(/[-:]/g,'');
    const date = moment().format('YYYYMMDD');
    const path = './vendors.json';
    const request = {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'host': 'awss3rnd.s3.amazonaws.com',
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
    
    const s3 = new AWS.Signers.S3();
    s3.request = request;
    s3.addAuthorization(credentials, new Date());
    // const signatureV4 = v4.signature(credentials, dateTime);
    // const credential = `${credentials.accessKeyId}/${date}/ap-southeast-1/s3/aws4_request`;
    // const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
    // const content = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    // const auth = `AWS4-HMAC-SHA256 Credential=${credential}, SignedHeaders=${signedHeaders}, Signature=${signatureV4}`;
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
    // res.send({ signingKey: base64.stringify(signingKey) });
  } catch(error) {
    next(error);
  }
});

module.exports = router;
