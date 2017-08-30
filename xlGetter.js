var GoogleSpreadsheet = require('google-spreadsheet');
var async = require('async');
// var port = process.env.PORT || 8080;
var events = ['as','ho','du','la','re'];
var _events = ['Assignment','Homework','Due-Date','Lab','Reminder'];
var evtCol = ['#f38dbc','#f58652','#786f6a','#a19ccb','#379061'];
//---------------------------------------
//REGEXES
// var _type = new RegExp(/\[.+\]/g);
//---------------------------------------
var timetable = {};
var fs = require('fs');
var courses = [];
// spreadsheet key is the long id in the sheets URL
var doc = new GoogleSpreadsheet('1jFXzxGFGdRJApNBgeQFFEh81qcbXdiXyqFiRKXhU9Fs');
var sheet;
var dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
var colours = ['#5b0f00', '#85200c', '#3d85c6', '#bf9000', '#f1c232', '#ffd966', '#6aa84f', '#38761d', '#741b47', '#a64d79', '#cc0000', '#e06666', '#ea9999'];
function getEvents(content){
  var rems = [];
  if(content.length != 0){
    var evts = content.split('*');
    // console.log(content);
    evts.shift();
    evts.forEach(function(el){
      // console.log(el);
      // console.log(_type);
      var type =  el.split(']')[0].split('[')[1];
      // console.log("Type: "+type);
      // console.log(_type.exec(el));
      var text = el.split(/\[.+\]/g)[1];
      var title = text.split('/')[0];
      var desc = text.split('/')[1];
      var index = events.indexOf(type);
      // console.log(text);
      // console.log("Index: "+index);
      var event = {
        'type': _events[index],
        'title':title,
        'desc':desc,
        'color':evtCol[index]
      };
      rems.push(event);
    });
  }else{
    rems = '';
  }
  return rems;
}
function getSchedule(week, callback) {
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
        console.log('Loaded doc: ' + info.title + ' by ' + info.author.email);
        sheet = info.worksheets[week - 1];
        timetable.title = sheet.title;
        timetable.schedule = [];
        sheet.getCells({
          'min-row': 2,
          'max-row': 14,
          'min-col': 1,
          'max-col': 1,
        }, function(err, cells) {
          for (var i = 0; i < cells.length; i++) {
            courses.push(cells[i].value);
          }
          // console.log(courses);
          // console.log(colours);
          step()
        });
      });
    },
    function getInfoAndWorksheets(step) {
      // dayNames.forEach(function(el,i,dayNames){
      var ind = 0;
      var ticker = setInterval(function() {
        // console.log("index : "+ind);
        if (ind == dayNames.length) {
          clearInterval(ticker);
          step();
        }
        sheet.getCells({
          'min-row': 2,
          'max-row': 14,
          'min-col': 2 + ind,
          'max-col': 2 + ind,
          'return-empty': false
        }, function(err, cells) {
          if (err) {
            console.log('Error: ' + err);
          } else {
            if (typeof cells != 'undefined') {
              // console.log("-------------------------------");
              var day = {
                'day': dayNames[ind - 1]
              };
              day.courses = [];
              for (var i = 0; i < cells.length; i++) {
                var cont = cells[i].value.split('^/')[1];
                // console.log("index: "+ cells[i].row+" / "+cells[i].col + cont);
                var evts= getEvents(cont)||"";
                // console.log(evts);
                var course = {'course': courses[cells[i].row - 2] + " \n " + cells[i].value.split('^/')[0],
                              'events': evts,
                              'color': String(colours[cells[i].row - 2]),
                              'row': cells[i].row,
                              'col': cells[i].col
                              };
                day.courses.push(course);
                // console.log(day.courses[i]);
              }
              timetable.schedule.push(day);
              // console.log("-------------------------------");
            }
          }
        });
        ind++;
        // });
      }, 500);
      // step();
    },
    function check(step) {
      // timetable.schedule.forEach(function(el){
      //   console.log(el);
      // });
      callback(null,timetable);
    }
  ], function(err) {
    if (err) {
      console.log('Error: ' + err);
    }
  });
}
module.exports.getSchedule = getSchedule;
// getSchedule(1,function(err,timetable){
//   if(err){
//     console.log('Error: ' + err);
//   }else{
//     // timetable = timetable;
//     console.log(timetable);
//   }
// });
