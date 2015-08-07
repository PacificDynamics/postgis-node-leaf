/**
 * Module dependencies.
 */

var http = require('http'),
    express = require('express'),
    methodOverride = require('method-override'),
    bodyParser = require('body-parser'),
    errorHandler = require('errorhandler'),
    //pg = require('pg-query'),
    db = require('./db.js');

var app = express();

// Configuration
app.set('port', process.env.PORT || 3000);
app.use(express.static(__dirname + '/public'));
app.use('/node_modules', express.static(__dirname + '/node_modules'));
app.set('views', __dirname);
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

if ('development' == app.get('env')) {
  app.use(errorHandler());
}
/*
app.configure('production', function(){
  app.use(express.errorHandler());
});

app.set('view options', {
  layout: false
});
// Use hamljs for HAML views
app.register('.haml', require('hamljs'));
*/

// Routes
app.get('/', function(req, res){
  res.render('index.html', {
  });
});

app.post('/RetrieveCadastre', function(req, res){
    db.RetrieveCadastre(req.body, res);
});

var server = http.createServer(app);
server.listen(app.get('port'), function(){
    console.log("Express server listening on port ", app.get('port'));
});
