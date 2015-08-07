// db.js

var pg = require('pg-query');

// UPDATE TO YOUR connectionParameters = 'postgres://user:password@host:5432/database';
pg.connectionParameters = 'postgres://clayton:postgres@localhost:5432/postgres';

// get table names that have geom when server loads
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


// need to update to deal with array of table names "tables"
function createDBSchema(err, rows, result) {
  if(err && err.code == "ECONNREFUSED"){
    return console.error("DB connection unavailable, see README notes for setup assistance\n", err);
  }
    var query = "CREATE TABLE "+table_name+
      " ( gid serial NOT NULL, name character varying(240), the_geom geometry, CONSTRAINT "+table_name+
        "_pkey PRIMARY KEY (gid) ) WITH ( OIDS=FALSE );";
    pg(query, addSpatialIndex);
};
function addSpatialIndex(err, rows, result) {
  pg("CREATE INDEX "+table_name+"_geom_gist ON "+table_name+" USING gist (the_geom);", importMapPoints);
}

function importMapPoints(err, rows, result) {
  if(err) {
    return console.error(error_response, err);
  }
  var insert = "Insert into "+table_name+" (name, the_geom) VALUES ";
  var qpoints = points.map(insertMapPinSQL).join(",");
  var query = insert + qpoints + ';';
  console.log(query);
  pg(query, function(err, rows, result) {
    if(err) {
      return console.error(error_response, err);
    }
    var response = 'Data import completed!';
    return response;
  });
};

function insertMapPinSQL(pin) {
  var query = '';
  var escape = /'/g

  if(typeof(pin) == 'object'){
    query = "('" + pin.Name.replace(/'/g,"''") + "', ST_GeomFromText('POINT(" + pin.pos[0] +" "+ pin.pos[1] + " )', 4326))";
  }
  return query;
};

function init_db(){
  pg('CREATE EXTENSION postgis;', createDBSchema);
}

function flush_db(){
  pg('DROP TABLE '+ table_name+';', function(err, rows, result){
    var response = 'Database dropped!';
    console.log(response);
    return response;
  });
}

function select_box(req, res, next){
  //clean these variables:
  var query = req.query;
  var limit = (typeof(query.limit) !== "undefined") ? query.limit : 40;
  if(!(Number(query.lat1)
    && Number(query.lon1)
    && Number(query.lat2)
    && Number(query.lon2)
    && Number(limit)))
  {
    res.send(500, {http_status:400,error_msg: "this endpoint requires two pair of lat, long coordinates: lat1 lon1 lat2 lon2\na query 'limit' parameter can be optionally specified as well."});
    return console.error('could not connect to postgres', err);
  }
  pg('SELECT gid,name,ST_X(the_geom) as lon,ST_Y(the_geom) as lat FROM ' + table_name+ ' t WHERE ST_Intersects( ST_MakeEnvelope('+query.lon1+", "+query.lat1+", "+query.lon2+", "+query.lat2+", 4326), t.the_geom) LIMIT "+limit+';', function(err, rows, result){
    if(err) {
      res.send(500, {http_status:500,error_msg: err})
      return console.error('error running query', err);
    }
    res.send(rows);
    return rows;
  })
};
function select_all(req, res, next){
  console.log(pg);
  pg('SELECT gid,name,ST_X(the_geom) as lon,ST_Y(the_geom) as lat FROM ' + table_name +';', function(err, rows, result) {
    console.log(config);
    if(err) {
      res.send(500, {http_status:500,error_msg: err})
      return console.error('error running query', err);
    }
    res.send(result);
    return rows;
  });
};


module.exports = exports = {
  RetrieveCadastre: RetrieveCadastre,
  selectAll: select_all,
  selectBox: select_box,
  flushDB:   flush_db,
  initDB:    init_db
};