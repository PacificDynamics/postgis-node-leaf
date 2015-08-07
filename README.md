## Postgis <-> node.js <-> Leaflet
simple node.js implementation to connect to postgresql db. Follows examples from
- https://github.com/ryanj/restify-postGIS/blob/master/bin/db.js,
- https://blog.openshift.com/instant-mapping-applications-with-postgis-and-nodejs/

### current version
Loads all tables that are registered in the geometry_columns view

### To do
- update original ryanj/restify-postGIS.git/bin/db.js functions
- write data from client instance
- add socket.io to share a) connected user locations and/or b) active data loaded (eg for collaborative pg saved spatial data editing)
