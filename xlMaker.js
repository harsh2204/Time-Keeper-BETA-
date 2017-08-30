var GoogleSpreadsheet = require('google-spreadsheet');
var async = require('async');
var express = require('express');
var tt = require('./timetable fixed.json')
var dayNames = ["-", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
var port = process.env.PORT || 8080;
var courses = [];
var lastClass = new Date(2000, 10, 21);
var firstClass = new Date(2020, 8, 22);
var timetable;
var fs = require('fs');
// spreadsheet key is the long id in the sheets URL
var doc = new GoogleSpreadsheet('1jFXzxGFGdRJApNBgeQFFEh81qcbXdiXyqFiRKXhU9Fs');
var sheet;
var weeks = 0;
var dates = [];
var newUser = true;
var errors = [];

function getDateString(date) {
  return date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
}

function editCell(el, row, col, content) {
  el.getCells({
    'min-row': row,
    'max-row': row + 1,
    'min-col': col,
    'max-col': col + 1,
    'return-empty': true
  }, function(err, cells) {
    if (err) {
      errors.push(err);
    } else {
      console.log(cells[0].row + ", " + cells[0].col);
      cells[0].value = content;
      cells[0].save();
    }
  });
}

function getWeekNames(curr) {
  var first = curr.getDate() - curr.getDay() + 1;
  var firstday = new Date(curr.setDate(first));
  var lastday = new Date(curr.setDate(firstday.getDate() + 4));
  return [getDateString(firstday), getDateString(lastday)];
}
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
  function getInfoAndWorksheets(step) {
    doc.getInfo(function(err, info) {
      console.log('Loaded doc: ' + info.title + ' by ' + info.author.email);
      sheet = info.worksheets[0];
      console.log('sheet 1: ' + sheet.title + ' ' + sheet.rowCount + 'x' + sheet.colCount);
      var sheets = info.worksheets;
      sheets.forEach(function(el, i, sheets) {
        if (el.title == "Week 1:4/9/2017 - 8/9/2017") {
          newUser = false;
        }
      });
      step();
    });
  },
  function prepTimeTable(step) {
    var i = 0;
    var ticker = setInterval(function() {
      console.log("prepTimeTable: " + i);
      if (i == tt.length) {
        console.log(firstClass + " -:- " + lastClass);
        // console.log(courses);
        step();
        clearInterval(ticker);
      } else {
        var course = tt[i].course_code_faculty + ":" + tt[i].course_code_number + " - " + tt[i].class_section;
        if (courses.indexOf(course) == -1) {
          courses.push(course);
        }
        //Do da dates
        var semEnd = tt[i].semester_end;
        var semStart = tt[i].semester_start;
        var date1 = new Date(semEnd.year, semEnd.month, semEnd.day);
        var date2 = new Date(semStart.year, semStart.month, semStart.day);
        if (date1 > lastClass) {
          lastClass = date1;
        } else if (date2 < firstClass) {
          firstClass = date2;
        }
        i++;
      }
    }, 200);
  },
  function check(step) {
    console.log("NEW: " + newUser);
    workonSheet();
  }
], function(err) {
  if (err) {
    console.log('Error: ' + err);
  }
});

function workonSheet() {
  if (newUser) {
    async.series([
      function setWeek(step) {
        weeks = 1;
        var now = firstClass;
        while (true) {
          console.log(now);
          if (now < lastClass) {
            dates.push(getWeekNames(now));
            var now = new Date(now.setDate(now.getDate() + 7)) //Next date
            weeks++;
          } else {
            console.log(dates);
            step();
            break;
          }
        }
      },
      function managingSheets(step) {
        var i = 1;
        var tick = setInterval(function() {
          if (i == weeks) {
            clearInterval(tick);
            step();
          } else {
            console.log("Ping");
            var name = "Week " + i + ":" + dates[i - 1][0] + " - " + dates[i - 1][1];
            doc.addWorksheet({
              title: name
            }, function(err, _sheet) {
              _sheet.resize({
                rowCount: 50,
                colCount: 20
              });
              _sheet.setHeaderRow(dayNames);
            });
            i++;
          }
        }, 1000);
      },
      function addCourses(step) {
        doc.getInfo(function(err, info) {
          console.log("STARTED ADDING COURSES");
          var worksheets = info.worksheets;
          worksheets.forEach(function(el, i, arr) {
            console.log("Sheet -" + String(i + 1) + " Name: " + el.title);
            el.getCells({
              'min-row': 2,
              'max-row': courses.length,
              'min-col': 1,
              'max-col': 1,
              'return-empty': true
            }, function(err, cells) {
              for (var i = 0; i < cells.length; i++) {
                cells[i].value = courses[i];
              }
              el.bulkUpdateCells(cells);
            });
          });
          step();
        });
      }

    ], function(err) {
      if (err) {
        console.log('Error: ' + err);
      }
    });
  } else {
    async.series([
      function checkforEmpty(step) {
        // console.log(tt);
        doc.getInfo(function(err, info) {
          console.log("Checking for empty ");
          var worksheet = info.worksheets[0];
          console.log('Current worksheet: ' + worksheet.title);
          worksheet.getCells({
            'min-row': 2,
            'max-row': courses.length,
            'min-col': 2,
            'max-col': 5,
          }, function(err, cells) {
            if (err) {
              console.log(err);
            } else {
              // console.log(cells);
              if (cells.length == 0) {
                console.log("EMPTY!!");
                step();
              } else {
                return;
              }
            }
          });
        });
      },
      function prepTimes(step) {
        timetable = [
          // {
          // row:1,
          // col:2,
          // content:
          // }
        ];
        var days = dayNames;
        days.shift();
        tt.forEach(function(el, i, tt) {
          var alt = false;
          var name = el.course_code_faculty + ":" + el.course_code_number + " - " + el.class_section;
          var _row = 2 + courses.indexOf(name);
          var _col = 2 + days.indexOf(el.day); //The day index from daynames array of days days.indexOf(el.day)
          var _content = el.start_time.hour + ":" + el.start_time.minute + " - " + el.end_time.hour + ":" + el.end_time.minute + " \n " +
            el.where + '\n ^/';
          if (el.alternate) alt = true;
          timetable.push({
            'row': _row,
            'col': _col,
            'content': _content,
            'alt': alt,
            'alt_time': el.alt_time
          });
        });
        // console.log(timetable);
        step();
      },
      function insertTimes(step) {
        // doc.getInfo(function(err, info) {
        //   console.log("Inserting Times");
        //   var worksheets = info.worksheets;
        //   var i = 0;
        //   var ticker1 = setInterval(function(){
        //     // worksheets.forEach(function(el, i, arr) {
        //     if(i==worksheets.length){
        //       step();
        //       clearInterval(ticker1);
        //     }
        //     console.log("Sheet - " + String(i + 1) + " Name: " + worksheets[i].title);
        //     var j = 0;
        //     var ticker2 = setInterval(function(){
        //       if(j==timetable.length){
        //         clearInterval(ticker2);
        //       }
        //       // timetable.forEach(function(course, index, timetable){
        //         var course = timetable[j];
        //         // console.log(course);
        //         if(!course.alt){
        //           editCell(worksheets[i], course.row, course.col, course.content);
        //           // console.log("non alt week: "+course.content);
        //         }else{
        //           if(i%2==course.alt_time){
        //             editCell(worksheets[i], course.row, course.col, course.content);
        //             // console.log((course.alt_time+1)+" alt week : "+course.content);
        //           }
        //         }
        //       // });
        //       j++;
        //     },200);
        //     // });
        //     i++;
        //   },5000)
        // });
        doc.getInfo(function(err, info) {
          console.log("Inserting Times");
          var worksheets = info.worksheets;
          var i = 0;
          async.whilst
            (
              function() {
                return i < worksheets.length
              },

              function(next_i) {
                var j = 0;
                async.whilst
                  (
                    function() {
                      return j < timetable.length;
                    },
                    function(callback) {
                      //Do stuff
                      var course = timetable[j];
                      // console.log(course);
                      if (!course.alt) {
                        editCell(worksheets[i], course.row, course.col, course.content);
                        // console.log("non alt week: "+course.content);
                      } else {
                        if (i % 2 == course.alt_time) {
                          editCell(worksheets[i], course.row, course.col, course.content);
                          // console.log((course.alt_time+1)+" alt week : "+course.content);
                        }
                      }
                      j++;
                      setTimeout(callback, 100);
                    },
                    function() {
                      i++;
                      next_i();
                    }
                  );
              }
            );
          step();
        });
      },
      function throwErrors(step) {
        fs.writeFile("errors.txt", errors, function(err) {
          if (err) {
            return console.log(err);
          }
          console.log("The file was saved!");
        });
        step();
      }
    ], function(err) {
      if (err) {
        console.log('Error: ' + err);
      }
    });
  }
}
