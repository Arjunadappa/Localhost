const mongoose = require('mongoose');
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true 

  })
  .then(() => console.log('DB connection successful!'));

module.exports = mongoose