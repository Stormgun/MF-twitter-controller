const http = require('http');

var hostname = '127.0.0.1';
var port = 3000;
var TwitterController = require('./src/js/index');
var server = http.createServer(function(req, res) {
    res.statusCode = 200;
res.setHeader('Content-Type', 'text/plain');
});

server.listen(port, hostname,function (){
    console.log("Server running at "+hostname);
    TwitterController.authWithMF(function(err,data){
            console.log(err,data);
        if(err){
                throw "quit it";
        }else{
            TwitterController.listenForTags(process.env.TAG);
        }
    });

});