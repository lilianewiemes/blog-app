if (process.env.NODE_ENV == 'production') {
  module.exports = { mongoURI: 'mongodb://liliane:123456l@ds163764.mlab.com:63764/blogapp-prod' }
} else {
  module.exports = { mongoURI: 'mongodb://localhost/blogapp' }
}
