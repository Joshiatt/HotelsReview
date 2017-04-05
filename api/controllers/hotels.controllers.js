var mongoose = require("mongoose");
var Hotel = mongoose.model('Hotel');

var runGeoQuery = function(req, res) {

  var lng = parseFloat(req.query.lng);
  var lat = parseFloat(req.query.lat);

  // A geoJSON point

  var point = {
    type : "Point",
    coordinates : [lng, lat]
  };

  var geoOptions = {
    spherical : true,
    maxDistance : 2000,
    num : 5
  };

  Hotel
    .geoNear(point, geoOptions, function(err, results, stats) {
      if( results == false ) {

        console.log("No nearby Hotels Found");
        res
          .status(400)
          .json({
            "message" : "No nearby Hotels Found"
          });

          return;


      }else if (err ) {

        console.log("Error finding cordinates");
        res
          .status(500)
          .json({
            "message" : "Bad request for lat and lng value"
          });
          return;

      }
      console.log("Geo Results", results);
      console.log("Geo stats", stats);
      res
        .status(200)
        .json(results);
    });
}

module.exports.hotelsGetAll = function(req, res) {

  // var db = dbconn.get();
  // var collection = db.collection('hotels');

  console.log('Requested by+', req.user);

  var offset = 0;
  var count = 5;
  var maxCount = 15;

  if(req.query && req.query.lat && req.query.lng) {
    runGeoQuery(req, res);
    return;
  }

  if(req.query && req.query.offset) {
    offset = parseInt(req.query.offset, 10);
  }

  if(req.query && req.query.count) {
    count = parseInt(req.query.count, 10);
  }

  if(isNaN(offset) || isNaN(count)){
    res
      .status(400)
      .json({
        "message" : "QueryString params count and offset should be Numbers"
      });

      return;
  }

  if(count > maxCount) {
    res
      .status(400)
      .json({
        "message" : "Count limit of " + maxCount + " Exceeded"
      });
      return;
  }

  Hotel
    .find()
    .skip(offset)
    .limit(count)
    .exec(function(err, hotels) {
      if(err) {
        console.log("Error Finding Hotels");
        res
          .status(500)
          .json(err);
      }else {

        console.log("Found Hotels", hotels.length);
        res
          .json(hotels);
      }

    });

  // collection
  //   .find()
  //   .skip(offset)
  //   .limit(count)
  //   .toArray(function(err, docs) {
  //     console.log("Found Hotels", docs);
  //     res
  //       .status(200)
  //       .json(docs);
  //   });

};



module.exports.hotelsGetOne = function(req, res) {

  var hotelId = req.params.hotelId;
  console.log("Get the HotelId:", hotelId);

  Hotel
    .findById(hotelId)
    .exec(function(err, doc) {

      var response = {
        status : 200,
        message : doc
      };

      if(err) {
        console.log("Error Finding Hotels", err);
        response.status = 500;
        response.message = err;

      }else if(!doc){
          response.status = 400;
          response.message = {
            "message" : "HotelId not found"
          };
        }

        res
          .status(response.status)
          .json(response.message);

    });

};


var _splitArray = function(input) {
  var output;
  if(input && input.length > 0) {
    output = input.split(";");
  }else {
    output = [];
  }
  return output;
};


module.exports.hotelsAddOne = function(req, res){


  Hotel
    .create({
      name : req.body.name,
      description : req.body.description,
      stars : parseInt(req.body.stars, 10),
      services : _splitArray(req.body.services),
      photos : _splitArray(req.body.photos),
      currency : req.body.currency,
      location : {
        address : req.body.address,
        coordinates : [
          parseFloat(req.body.lng),
          parseFloat(req.body.lat)
        ]
      }
    }, function(err, hotel) {
      if(err) {
        console.log("Error creating hotel");

        res
          .status(400)
          .json(err);

      }else {

        console.log("Hotel created", hotel);

        res
          .status(201)
          .json(hotel);
      }
    });
};



module.exports.hotelsUpdateOne = function(req, res) {

  var hotelId = req.params.hotelId;
  console.log("Get the HotelId:", hotelId);

  Hotel
    .findById(hotelId)
    .select("-reviews -rooms")
    .exec(function(err, doc) {

      var response = {
        status : 200,
        message : doc
      };

      if(err) {
        console.log("Error Finding Hotels", err);
        response.status = 500;
        response.message = err;

      }else if(!doc){
          response.status = 400;
          response.message = {
            "message" : "HotelId not found"
          };
        }

        if( response.status !== 200) {
          res
            .status(response.status)
            .json(response.message);

        }else {

          doc.name = req.body.name;
          doc.description = req.body.description;
          doc.stars = parseInt(req.body.stars, 10);
          doc.services = _splitArray(req.body.services);
          doc.photos = _splitArray(req.body.photos);
          doc.currency = req.body.currency;
          doc.location = {
            address : req.body.address,
            coordinates : [
              parseFloat(req.body.lng),
              parseFloat(req.body.lat)
            ]
          };


          doc.save(function(err, doc) {
            if(err) {
              res
                .status(500)
                .json(err);
            }else {
              console.log("Docment updated by PUT request:", doc);
                res
                  .status(204)
                  .json();
            }
          });

        }

    });

};

module.exports.hotelsDeleteOne = function(req, res) {
  var hotelId = req.params.hotelId;

  Hotel
    .findByIdAndRemove(hotelId)
    .exec(function(err, hotel) {
      if(err) {
        res
          .status(404)
          .json(err);
      }else {
        console.log("Hotel deleted: ", hotel);
        res
          .status(204)
          .json();
      }
    });
};
