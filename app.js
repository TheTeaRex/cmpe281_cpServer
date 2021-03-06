var fs = require('fs');
var https = require('https');
var express = require('express');
var bodyParser = require('body-parser');
var aws = require('aws-sdk');
var sh = require('shorthash');
var request = require('request');

var app = express();
//app.use(express.bodyParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var queueUrl = "amazonQueueLink";
var ipUrl = "http://169.254.169.254/latest/meta-data/public-ipv4";
var shortDomain = "http://54.193.121.101/";

// Load your AWS credentials and try to instantiate the object.
aws.config.loadFromPath(__dirname + '/config.json');

// Instantiate SQS.
var sqs = new aws.SQS();
/*
// getting the keys
var options = {
    key : fs.readFileSync('../keys/cpserver.key'),
    cert : fs.readFileSync('../keys/cpserver.crt')
}
*/
var convertURL = function(longurl, callback) {
    shorturl = sh.unique(longurl);
    sendMessageSQS(longurl, shorturl);
    callback(shortDomain + sh.unique(longurl));
}

var getPublicIP = function(callback){
    request({
        url : ipUrl,
        method : "GET"
    }, function(error, response, body){
        console.log("getting IP: " + body);
        callback(body);
    })
}

var sendMessageSQS = function(longurl, shorturl){
    var message = {
        longurl : longurl,
        shorturl : shorturl
    };
    console.log(message);
    var params = {
        MessageBody: JSON.stringify(message),
        QueueUrl: queueUrl,
        DelaySeconds: 0
    };
    
    sqs.sendMessage(params , function (err, data) {
        if(err){
            console.log("error: " + err);
        }
        else {
            console.log("data: " + JSON.stringify(data));
        }
    });
}

var handle_post = function (req, res) {
    console.log("Post: ..." );
    console.log(req.body.longurl);
    getPublicIP( function(publicIP){
    longurl = req.body.longurl;
    convertURL(longurl, function(shorturl){
        console.log(shorturl);
        res.setHeader('Content-Type', 'application/json');
        var data = {shorturl: shorturl, publicIP:publicIP};
        console.log(data);
        res.json(data);
    })
    });
}
app.post("*", handle_post );
app.listen(process.env.PORT || 80);
console.log('CP Server Started!');
//https.createServer(options, app).listen(process.env.PORT || 443);
