var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://Admin:Admin123@ds137643.mlab.com:37643/mydb');
console.log("mongodb connect...")
module.exports = mongoose;
