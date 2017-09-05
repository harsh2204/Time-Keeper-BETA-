// script.js
var timetable;
// create the module and name it timeKeeper
// also include ngRoute for all our routing needs
var timeKeeper = angular.module('TimeKeeper', ['ngRoute']);
// configure our routes
timeKeeper.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
  $routeProvider
    // route for the home page
    .when('/', {
      templateUrl: 'pages/home.html',
      controller: 'homeCtrl'
    })

    // route for the display page
    .when('/week/:weekId', {
      templateUrl: 'pages/displaySchedule.html',
      controller: 'weekController',
      controllerAs: 'display'
    })
    .when('/week/:weekId/day/:dayName', {
      templateUrl: 'pages/dayTemp.html',
      controller: 'dayCtrl',
      controllerAs: 'day'
    })
    // route for the event page
    .when('/week/:weekId/day/:dayName/:course/event', {
      templateUrl: 'pages/addEvent.html',
      controller: 'eventCtrl',
      controllerAs: 'event'
    }).otherwise({
      redirectTo: '/'
    });
  // $locationProvider.html5Mode(true);
  // $locationProvider.hashPrefix('');
}]);

// create the controller and inject Angular's $scope
timeKeeper.controller('homeCtrl', ['$scope', '$http', function($scope, $http) {
  $scope.password = '';


  $scope.login = function() {

    if (!$scope.password) return;

    $scope.message = "Working hard to process your timetable!";
    $scope.loading = true;
    $scope.processing = true;
    $(".btnLogin").prop('disabled', true);
    $http({
      method: 'POST',
      url: '/login',
      data: {
        'pass': $scope.password
      }
    }).then(function successCallback(data) {
      console.log(data);
      if (data.data.auth) {
        window.location.replace("/#/week/1");
      } else {
        $(".btnLogin").prop('disabled', false);
      }
    }, function errorCallback(data) {
      // $scope.processing = false;
      $(".btnLogin").prop('disabled', false);
      // $scope.message = data.data;
    });
  };
}]);

timeKeeper.controller('weekController', ['$route', '$routeParams', '$scope', '$http', function($route, $routeParams, $scope, $http) {
  this.$routeParams = $routeParams;
  this.$route = $route;
  var buttonCheck = function() {
    if ($scope.week == 14) {
      $('.btn-next').prop('disabled', true);
    }
    if ($scope.week == 1) {
      $('.btn-prev').prop('disabled', true);
    }
  }
  $scope.nextWeek = function() {
    // console.log("NEXT!")
    var weeknum = Number($scope.week) + 1;
    window.location.replace("/#/week/" + String(weeknum));
  }
  $scope.prevWeek = function() {
    // console.log("PREV!")
    var weeknum = Number($scope.week) - 1;
    window.location.replace("/#/week/" + String(weeknum));
  }
  $scope.week = $routeParams.weekId;
  $scope.weekNum = "";
  // $scope.schedule = {'couses':'asd'};
  //Get the timetable processed in xls

  var getTimetable = function() {
    $('.btn-prev').prop('disabled', true);
    $('.btn-next').prop('disabled', true);
    $http({
      method: 'POST',
      url: '/timetable',
      data: {
        'id': 'harsh',
        'week': $scope.week
      }
    }).then(function successCallback(data) {
      if (!data || !data.data) return;
      console.log(data.data);
      timetable = data.data;
      $scope.weekNum = timetable.title;
      $scope.timetable = timetable.schedule;
      $('.btn-prev').prop('disabled', false);
      $('.btn-next').prop('disabled', false);
      buttonCheck();
      $('.noClasses').remove();
      setTimeout(noClasses, 500);
      // Digest($scope.schedule = timetable.schedule);
      // $scope.$apply();
      //Add elements based into specific divs <div day="ASDOMACO"> from the elements in timetable.schedule
      //Add specific course divs into each of <day>divs from timetable.schedule[day].courses
    }, function errorCallback(data) {
      console.log(data);
      $scope.schedule = $scope.schedule || "N/A";
    });
  };
  // setTimeout(getTimetable,1000);
  // if(!timetable){
    getTimetable();
  // }
}]);


timeKeeper.controller('eventCtrl', ['$routeParams', '$scope', '$http', function($routeParams, $scope, $http) {
  // console.log("ON EVENT!");
  // console.log($routeParams);
  // console.log(timetable.schedule[parseInt($routeParams.dayName)-1].courses[parseInt($routeParams.course)]);
  var weekid = parseInt($routeParams.weekId);
  var _course = timetable.schedule[parseInt($routeParams.dayName) - 1].courses[parseInt($routeParams.course)];
  var course = _course.course;
  this.color = _course.color;
  this.title = course.split('\n')[0];
  this.time = course.split('\n')[1];
  this.where = course.split('\n')[2];
  $scope.sendEvent = function() {
    $('.btn-send').attr('disabled', 'true');
    var title = $('.title').val();
    var type = $('.type').val();
    var content = $('.content').val();
    if (!title || !content) {
      alert("PLEASE FILL ALL THE FIELDS");
      $('.btn-send').attr('disabled', 'false');
    } else {
      var evt = "*" + type + title + "/" + content;
      console.log(evt);
      $('.btn-send').attr('disabled', 'false');
      $http({
        method: 'POST',
        url: '/add',
        data: {
          'event': evt,
          'row': _course.row,
          'col': _course.col,
          'week': weekid
        }
      }).then(function successCallback(data) {
        if (!data || !data.data) return;
        var link = location.href;
        link = link.split('/');
        link.pop();
        link.pop();
        console.log(link);
        alert('Your event was successfully added!');
        location.href = link.join('/');
      }, function errorCallback(data) {
        console.log(data);
      });
    }
  };
  //REGEX FOR Content /\[.+\]/g
}]);
timeKeeper.controller('dayCtrl', ['$routeParams', '$http', '$scope', function($routeParams, $http, $scope) {
  // console.log(timetable);
  var regetTimetable = function(callback) {
    if (!timetable) {
      console.log("GETING NEW!");
      $http({
        method: 'POST',
        url: '/timetable',
        data: {
          'id': 'harsh',
          'week': $routeParams.weekId
        }
      }).then(function successCallback(data) {
        if (!data || !data.data) return;
        // console.log(data.data);
        callback(data.data);
        // Digest($scope.schedule = timetable.schedule);
        // $scope.$apply();
        //Add elements based into specific divs <div day="ASDOMACO"> from the elements in timetable.schedule
        //Add specific course divs into each of <day>divs from timetable.schedule[day].courses
      }, function errorCallback(data) {
        console.log(data);
      });
    } else {
      console.log("USING OLD!");
      callback(timetable);
    }
  };
  // have something like var tt = timetable||getTimetable() <- Function makes a post request based on the routeparams
    regetTimetable(function(tt) {
      console.log(tt);
      // var self = this;
    var date = tt.title.split(':')[1];
    date = date.split(' - ')[0];
    date = new Date(date.split('/')[2], Number(date.split('/')[1]) - 1, date.split('/')[0]);
    date.setDate(date.getDate() + (parseInt($routeParams.dayName) - 1));
    $scope.dayTitle = tt.schedule[parseInt($routeParams.dayName) - 1].day + " - " + date.toLocaleDateString();
    $scope.courses = tt.schedule[parseInt($routeParams.dayName) - 1].courses;
    console.log($scope.day);
    // $scope.$apply();
  });
  //Setup data parsing from course content!!
  // console.log(this.day);
  // $scope.addEvent = function(course){
  //   console.log(course);
  // }
  $scope.removeEvent = function(evt, row, col) {
    var week = parseInt($routeParams.weekId);
    // console.log("REMOVE!!");
    $http({
      method: 'POST',
      url: '/rem',
      data: {
        'event': evt,
        'row': row,
        'col': col,
        'week': week
      }
    }).then(function successCallback(data) {
      if (!data || !data.data) return;
      console.log(data.data);
      // var link = location.href;
      // link = link.split('/');
      // link.pop();
      // link.pop();
      // console.log(link);
      // alert('Your event was successfully added!');
      // location.href = link.join('/');
    }, function errorCallback(data) {
      console.log(data);
    });
  }

}]);

var remEvent = function(eventID) {
  var tags = ['as', 'ho', 'du', 'la', 're'];
  var _events = ['Assignment', 'Homework', 'Due-Date', 'Lab', 'Reminder'];
  var evt = $(eventID);
  var parent = evt.parent();
  var type = "[" + tags[_events.indexOf($(parent.children()[0]).html().split(' : ')[0])] + "]";
  var title = $($(parent.children()[0]).children()[0]).html();
  var content = $($(parent.children()[1]).children()[0]).html();
  var _evt = "*" + type + title + "/" + content;
  // var course = timetable.schedule[parseInt($routeParams.dayName)-1].courses[0];
  var courseid = evt.parents().eq(3).children('.btn-add').attr('courseid');
  var day = location.href.split('/');
  day = parseInt(day[day.length - 1]) - 1;
  var row = timetable.schedule[day].courses[courseid].row;
  var col = timetable.schedule[day].courses[courseid].col;
  // console.log(_evt);
  // evt, week, row, col
  // var scope = angular.element(document.getElementById("MainWrap")).scope();
  var scope = angular.element($(eventID).parents().eq(5)).scope();
  // console.log(scope);
  scope.$apply(function() {
    scope.removeEvent(_evt, row, col);
  });
}
var addEvent = function(course) {
  // console.log('addevent!!');
  location.href = window.location + '/' + $(course).attr('courseID') + '/event';
};
var goBack = function() {
  var link = location.href;
  link = link.split('/');
  link.pop();
  link.pop();
  location.href = link.join('/');
}
