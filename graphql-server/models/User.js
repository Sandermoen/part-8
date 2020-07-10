const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: {
    type: String,
    minlength: 3,
    unique: true,
  },
  favoriteGenre: String,
});

userSchema.plugin(uniqueValidator);
const UserModel = mongoose.model('User', userSchema);
module.exports = UserModel;
