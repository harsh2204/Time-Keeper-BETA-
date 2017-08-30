var fs = require('fs');
var express = require('express');
var async = require('async');
var bodyParser = require('body-parser');
var https = require('https');
var port = process.env.PORT || 8080;
var winston = require('winston');
var getter = require('./xlGetter.js');
var setter = require('./xlSetter.js');
var logger = require('express-logger');
// middleware
var app = express();

app.use(bodyParser.json());
var jsonParser = bodyParser.json();
app.use(logger({
  path: './log.txt'
}));
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get('/', function(req, res) {
  winston.info('User connected: ' + req.connection.remoteAddress || 'localhost');
  res.sendFile(__dirname + '/public/index.html');
});

app.post('/login', function(req, res) {
  if (req.body.pass == "harshgup") {
    res.send({
      'auth': true
    });
    //I THINK SEND FILE OF
  } else {
    res.send({
      'auth': false
    });
  }
});

app.post('/timetable', jsonParser, function(req, res) {
  var timetable;
  if (req.body.id == "harsh") {
        getter.getSchedule(req.body.week, function(err, tt) {
          if (err) {
            console.log(err);
          } else {
            res.json(tt);
          }
        });
  }
});
app.post('/add', jsonParser, function(req, res) {
  setter.setEvent(req.body.event,req.body.row,req.body.col,req.body.week, function(err, done){
    if(err){
      console.log(err);
    }else{
      res.send({
        'done':done
      });
    }
  });
});
app.post('/rem', jsonParser, function(req, res) {
  // console.log(req.body);
  setter.remEvent(req.body.event,req.body.row,req.body.col,req.body.week, function(err, done){
    if(err){
      console.log(err);
    }else{
      res.send({
        'done':done
      });
    }
  });
});

app.use(express.static(__dirname + '/public'));
app.listen(port, function() {
  winston.info("Started server at http://localhost:" + port);
});
