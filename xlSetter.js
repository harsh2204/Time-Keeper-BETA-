var GoogleSpreadsheet = require('google-spreadsheet');
var async = require('async');
// var port = process.env.PORT || 8080;
var done = false;
var fs = require('fs');
// spreadsheet key is the long id in the sheets URL
var doc = new GoogleSpreadsheet('1jFXzxGFGdRJApNBgeQFFEh81qcbXdiXyqFiRKXhU9Fs');
var sheet;
function setEvent(evt, row, col, week, callback) {
  async.series([
    function setAuth(step) {
      // see notes below for authentication instructions!
      var creds = require('./private/TimeKeeper-7ad46e8137f2.json');
      // OR, if you cannot save the file locally (like on heroku)
      // var creds_json = {
      //   client_email: 'admin-2204@timekeeper-2204.iam.gserviceaccount.com',
      //   private_key: 'your long private key stuff here'
      // }
      doc.useServiceAccountAuth(creds, step);
    },
    function setupCourses(step) {
      doc.getInfo(function(err, info) {
        sheet = info.worksheets[week - 1];
        // console.log(sheet.title);
        // console.log(row+"/"+col);
        sheet.getCells({
          'min-row': row,
          'max-row': row,
          'min-col': col,
          'max-col': col,
          'return-empty': true
        }, function(err, cells) {
          // console.log(cells);
          cells[0].value = cells[0].value+ evt;
          cells[0].save();
          done = true;
          step()
        });
      });
    },

    function check(step) {
      callback(null,done);
    }
  ], function(err) {
    if (err) {
      callback(err,done);
    }
  });
}
function remEvent(evt, row, col, week, callback) {
  async.series([
    function setAuth(step) {
      // see notes below for authentication instructions!
      var creds = require('./private/TimeKeeper-7ad46e8137f2.json');
      // OR, if you cannot save the file locally (like on heroku)
      // var creds_json = {
      //   client_email: 'admin-2204@timekeeper-2204.iam.gserviceaccount.com',
      //   private_key: 'your long private key stuff here'
      // }
      doc.useServiceAccountAuth(creds, step);
    },
    function setupCourses(step) {
      doc.getInfo(function(err, info) {
        sheet = info.worksheets[week - 1];
        // console.log(sheet.title);
        // console.log(row+"/"+col);
        sheet.getCells({
          'min-row': row,
          'max-row': row,
          'min-col': col,
          'max-col': col,
          'return-empty': true
        }, function(err, cells) {
          // console.log(cells);
          var temp = cells[0].value;
          // console.log(temp);
          // console.log(evt);
          temp = temp.replace(evt,"");
          // console.log(temp);
          cells[0].value = temp;
          cells[0].save();
          done = true;
          step();
        });
      });
    },

    function check(step) {
      // console.log("REMOVED "+evt);
      callback(null,done);
    }
  ], function(err) {
    if (err) {
      callback(err,done);
    }
  });
}
module.exports.setEvent = setEvent;
module.exports.remEvent = remEvent;
