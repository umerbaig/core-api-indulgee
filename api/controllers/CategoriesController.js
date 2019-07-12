'use strict';
const Categories = require('../models/Categories');
const Deals = require('../models/Deals');
const Boom = require('boom');
const controller = {};


//GET /Special Deals Count

controller.getSpecialDealCount = function (request, reply ) {
  const aggregation = [];
  const special_deal = request.query.special_deal || false;
  const special_deal_id = request.query.special_deal_id;

  if (special_deal) {
    Categories.update({_id: '5b866ddb150fb9f4bf3e956b'}, {availability: special_deal_id }, (err, cat) => {
      if (err) {
        return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
      }
      return reply({success: true});
    });
  } else {
    aggregation.push({
      $match: {
        "special_deal": true
      }
    });
  
    aggregation.push({
      $project: {
        _id: 1,
        created_at: 1,
        special_deal: 1,
        availability: 1,
        days: {
          $multiply: [ "$availability.days", 24*60*60000]
        }
      }
    });
  
    // now add the number of days to the starting_date in each deal that becomes ending date of deal
    aggregation.push({
      $project: {
        _id: 1,
        created_at: 1,
        availability: 1,
        special_deal: 1,
        days: 1,
        ending_date: {
          $add: [ "$availability.starting_date", "$days"]
        }
      }
    });
    
    // // compare the ending date with date now if its not less than deal is still active
  
    aggregation.push({
      $match: {
        "ending_date": {
          $gt: new Date()
        }
      }
    });
  
    Deals
    .aggregate(aggregation)
    .exec()
    .then((deals) => {
      return reply({special_deal_count: deals.length});
    })
    .catch((err) => {
      return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
    });
  }
};

// GET /categories
controller.getAll = function (request, reply) {
  const limit = request.query.limit || 30;
  const skip = (request.query.page || 0) * limit;
  const aggregation = [];

  // left join on deals collection to get all deals by that category
  aggregation.push(
    {
      $lookup: {
        from: "deals",
        localField: "_id",
        foreignField: "category",
        as: "deals"
      }
    }
  );

  // now unwind that deals array to get full plain objects in array
  aggregation.push({
    $unwind: {
      path: "$deals",
      preserveNullAndEmptyArrays: true
    }
  });

  aggregation.push({
    $project: {
      _id: 1,
      description: 1,
      name: 1,
      created_at: 1,
      picture: 1,
      availability: 1,
      deals: {
        availability: 1,
        days: {
          $multiply: [ "$deals.availability.days", 24*60*60000]
        }
      }
    }
  });


  // now add the number of days to the starting_date in each deal that becomes ending date of deal
  aggregation.push({
    $project: {
      _id: 1,
      description: 1,
      name: 1,
      picture: 1,
      availability: 1,
      created_at: 1,
      deals: {
        availability: 1,
        days: 1,
        ending_date: {
          $add: [ "$deals.availability.starting_date", "$deals.days"]
        }
      }
    }
  });
  //
  // // compare the ending date with date now if its not less than deal is still active
  aggregation.push({
    $match: {
      "deals.ending_date": {
        $gt: new Date()
      }
    }
  });
  // now group by _id (category) and count the rows because that'd be our deals count ;)
  // get the other fields as well, now thank me later :*
  aggregation.push({
    $group: {
      _id: "$_id",
      name: {
        $first: "$name"
      },
      description: {
        $first: "$description"
      },
      availability: {
        $first: "$availability"
      },
      picture: {
        $first: "$picture"
      },
      created_at: {
        $first: "$created_at"
      },
      deals_count: { "$sum": 1 }
    }
  });

  Categories
    .aggregate(aggregation)
    .limit(limit)
    .skip(skip)
    .exec()
    .then((categories) => {
      Categories.find().exec().then((originalCategories) => {
        const restCategories = originalCategories.filter((cat) => {
          return !categories.filter((ct) => cat._id.toString() == ct._id.toString()).length;
        }).map((obj) => {
          const tmp = Object.assign({deals_count: 0},obj.toObject());
          return tmp;
        });
        return reply({
          data: restCategories.concat(categories),
          paging: { total: originalCategories.length }
        });
      })
      .catch(() => {
        return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
      });
    })
    .catch((err) => {
      return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
    });
}
// POST / Categories
controller.create = function (request, reply) {
  const Category = new Categories(request.payload);
  Category.save().then((category) => {
    return reply({success: true, category_id: category._id});
  }).catch((error) => {
    return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
  });
}

module.exports = controller;
