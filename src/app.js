/* src/app.js */
angular.module('myApp', ['myChart'])
// Socket.IO Wrapper
.factory('socket', ["$rootScope",
  function($rootScope) {
    var socketio = io.connect();
    return {
      on: function (e, callback) {
        socketio.on(e, function() {
          var args = arguments;
          $rootScope.$apply(function() {
            callback.apply(socketio, args);
          });
        });
      },
      emit: function (e, data, callback) {
        socketio.emit(e, data, function() {
          var args = arguments;
          $rootScope.$apply(function() {
            if (callback) {
              callback.apply(socketio, args);
            }
          });
        });
      }
    };
  }
])
.controller('MainCtrl', ["$scope", "socket",
  function ($scope, socket) {
$scope.logs = [
{
  name: 'PreactActiefBackend.info',
  path: 'D:\Development\PreAct\myPreact\myPreactService.ConsoleHost\bin\Logs\myPreactCore_info.log',
  parser: {
    line: "\n",
    word: /[-"]/gi,
    rem: /["\[\]]/gi
  },
  map: function(d) {
    var format = d3.time.format("%d/%b/%Y:%H:%M:%S %Z");
    return {
      ip: d[0], time: +format.parse(d[2]), request: d[3], status: d[4], agent: d[8]
    }
  },
  data: []
},
{
  name: 'PreactActiefBackend.error',
  path: 'D:\Development\PreAct\myPreact\myPreactService.ConsoleHost\bin\Logs\myPreactCore_error.log',
  parser: {
    line: /# Time:/,
    word: /\n/gi,
    rem: /[#"\[\]]/gi
  },
  map: function(d) {
    var format = d3.time.format("%y%m%d %H:%M:%S");
    return {
      time: +format.parse(d[0]), host: d[1], query: d[2]
    }
  },
  data: []
}];

    angular.forEach($scope.logs, function(log){

      socket.emit('watch', {
        name: log.name,
        path: log.path
      });

      socket.on(log.name, function(data){
        console.log("Received: " + data);

        // The data log as string
        var responseDataStr = data;

        // 1:
        // Parse string to an array of datum arrays
        var parsed = StringParser(responseDataStr, log.parser.line, log.parser.word, log.parser.rem);

        // 2:
        // Map each datum array to object
        var mapped = parsed.map(log.map);

        // 3:
        // Filter the data
        var filtered = mapped.filter(function(d){
            return !isNaN(d.time);
        });

        // 4:
        // Group the dataset by time
        var grouped = Classifier(filtered, function(d) {
            var coeff = 1000 * 60 * $scope.groupByMinutes;
            return Math.round(d.time / coeff) * coeff;
        });

        // Use the grouped data for the chart
        log.data = grouped;
      });
    });
  }
]);