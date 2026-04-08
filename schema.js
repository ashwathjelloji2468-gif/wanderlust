 const Joi = require("joi");
 module.exports.reviewSchema = Joi.object({
  username: Joi.string().required(),
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().required()
});