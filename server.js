/* server.js */
var fs = require('fs');
var tail = require('tail').Tail;
var app = require('express')();
var http = require('http').Server(app);
var serveStatic = require('serve-static');
var io = require('socket.io')(http);

// Serve all files of the root directory
app.use(serveStatic('.', {'index': ['index.html']}));

// Wait for socket connection
io.on('connection', function(socket){
 
 var watchers = [];
 var senders = [];

// Send the content of a file to the client
  var sendFile = function(name, path) {

      // Read the file
      fs.readFile(path, 'utf8', function (err, data) {
        // Emit the content of the file
        io.emit(name, data);
    });
  };
  
  // Wait for events on socket
  socket.on('watch', function(obj){
     if (!watchers.hasOwnProperty(obj.name)){

       console.log("Watching " + obj.name);
       var options= {lineSeparator: /[\r]{0,1}\n/, fromBeginning: false, watchOptions: {interval: 500}, follow: true}

       watchers[obj.name] = new tail(obj.path, options);
       senders[obj.name] = function(data){
         io.emit(obj.name, data);
        };

       watchers[obj.name].on("line", senders[obj.name]);
    }
  });
  
  socket.on('disconnect', function(){
    watchers.forEach(function(obj) {
      fs.unwatchFile(obj.path);
    });
  });
});

// Listen on port 3000
http.listen(3000, function(){
  console.log('listening on 0.0.0.0:3000');
});