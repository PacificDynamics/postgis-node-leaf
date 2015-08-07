/**
 * Module dependencies.
 */

var http = require('http'),
    express = require('express'),
    methodOverride = require('method-override'),
    bodyParser = require('body-parser'),
    errorHandler = require('errorhandler'),
    pg = require('pg-query');

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
    RetrieveCadastre(req.body, res);
});

// get table names that have geom when server loads
// UPDATE TO YOUR connectionParameters = 'postgres://user:password@host:5432/database';
pg.connectionParameters = 'postgres://clayton:postgres@localhost:5432/postgres';
var tables = [];
pg('SELECT f_table_name tbl FROM geometry_columns;', function(err, rows, result){
  if (err) {
    console.log("error getting table names");
  } else {
    tables = rows;
  }
});

// RetrieveCadastre: returns all data in postgresql db within bounds of map window
function RetrieveCadastre(bounds, res){
  console.log('starting RetrieveCadastre function');
  // var connString = 'tcp://spatial:spatial@localhost/Spatial'; connectionParameters = 'postgres://user:password@host:5432/database';
//  pg.connectionParameters = 'postgres://clayton:postgres@localhost:5432/postgres';
//  var vals = [bounds._southWest.lng, bounds._southWest.lat, bounds._northEast.lng, bounds._southWest.lat, bounds._northEast.lng, bounds._northEast.lat,
//              bounds._southWest.lng, bounds._northEast.lat, bounds._southWest.lng, bounds._southWest.lat];
  var bbox = [[bounds._southWest.lng, bounds._southWest.lat].join(' '), [bounds._northEast.lng, bounds._southWest.lat].join(' '),[bounds._northEast.lng, bounds._northEast.lat]
              .join(' '),[bounds._southWest.lng, bounds._northEast.lat].join(' '),[bounds._southWest.lng, bounds._southWest.lat].join(' ')].join(",");
  //console.log('bbox = ', bbox);
  var sqlFull = [];
  for (i=0; i < tables.length; i++) {
    var sql = 'select ST_AsGeoJSON(geom) as shape ' + 'from ' + tables[i].tbl + ' ';
    sql = sql + 'where geom && ST_GeomFromText(\'SRID=4326;POLYGON((' + bbox + '))\') ';
    sql = sql + 'and ST_Intersects(geom, ST_GeomFromText(\'SRID=4326;POLYGON((' + bbox + '))\'))';
    sqlFull.push(sql);
  }
  if (tables.length > 1) {
    var sql = sqlFull.join(' UNION ALL ') + ';'; // concatenate all geom responses and adds end of statement ';'
  } else {
    var sql = sqlFull + ';';
  }
//  console.log('sql = ', sql);
//  var vals = [bounds._southWest.lng, bounds._southWest.lat, bounds._northEast.lng, bounds._southWest.lat, bounds._northEast.lng, bounds._northEast.lat, bounds._southWest.lng, bounds._northEast.lat, bounds._southWest.lng, bounds._southWest.lat];
//  var vals = vals.concat(vals);
//  console.log('sql typof = ', typeof sql);
  //console.log('poly = ', JSON.stringify(poly));
/*  // test query
    pg('SELECT NOW()', function(err, rows, result) {
    if (err) {
      console.log('test err ', err);
    } else {
      console.log('query rows are ', JSON.stringify(rows));
    }
  });
*/
  pg(sql, function(err, rows, result) {
    if (err) {
      console.log('in err, sql = ', sql);
      console.log('query error in RetrieveCadastre: ', err);
      //break
    } else {
      var featureCollection = new FeatureCollection();

      for (i = 0; i < rows.length; i++){
        featureCollection.features[i] = JSON.parse(rows[i].shape);
      }
      res.send(featureCollection);
    }
  });
}

// GeoJSON Feature Collection
function FeatureCollection(){
    this.type = 'FeatureCollection';
    this.features = new Array();
}

var server = http.createServer(app);
server.listen(app.get('port'), function(){
    console.log("Express server listening on port ", app.get('port'));
});
