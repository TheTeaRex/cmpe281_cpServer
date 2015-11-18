var fs = require('fs');
var express = require('express');
var Client = require('node-rest-client').Client;
var aws = require('aws-sdk');
var crypto = require('crypto');
var sh = require('shorthash');

var app = express();
app.use(express.bodyParser());
app.use("/images", express.static(__dirname + '/images'));

var queueUrl = "https://sqs.us-west-2.amazonaws.com/060340690398/team6cp";

// Load your AWS credentials and try to instantiate the object.
aws.config.loadFromPath(__dirname + '/config.json');

// Instantiate SQS.
var sqs = new aws.SQS();

var convertURL = function(longurl, callback) {
    //shorturl = crypto.createHash('md5').update(longurl).digest("hex");
    shorturl = sh.unique(longurl)
    sendMessageSQS(longurl, shorturl);
    callback(shorturl);
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
    longurl = req.body.longurl;
    convertURL(longurl, function(shorturl){
        console.log(shorturl);
        res.setHeader('Content-Type', 'application/json');
        var data = {"shorturl": shorturl};
        console.log(data);
        res.json(data);
    });
}
app.post("*", handle_post );
app.listen(process.env.PORT || 80);
