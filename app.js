// Carregando módulos
const express = require('express')
const handlebars = require('express-handlebars')
const bodyParser = require('body-parser')
const app = express()
const admin = require('./rotas/admin')
const path = require('path')
const mongoose = require('mongoose')
const session = require('express-session')
const flash = require('connect-flash')
require('./models/Postagem')
const Postagem = mongoose.model('postagens')
require('./models/Categoria')
const Categoria = mongoose.model('categorias')
const usuarios = require('./rotas/usuario')
const passport = require('passport')
require('./config/auth')(passport)
const db = require('./config/db')

// Configurações
// Sessão
app.use(session({
  secret: 'cursodenode',
  resave: true,
  saveUninitialized: true
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())

// Midleware
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg')
  res.locals.error_msg = req.flash('error_msg')
  res.locals.error = req.flash('error')
  res.locals.user = req.user || null
  next()
})

// Body Parser
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// Handlebars
app.engine('handlebars', handlebars({ defaultLayout: 'main' }))
app.set('view engine', 'handlebars')

// Mongoose
mongoose.Promise = global.Promise
mongoose.connect(db.mongoURI)
  .then(function () {
    console.log('Conectado ao Mongo')
  })
  .catch(function (erro) {
    console.log('Erro ao se conectar ao mongo: ' + erro)
  })

// Public
app.use(express.static(path.join(__dirname, 'public')))

// Rotas
// Rota para o acesso de administrado
app.use('/admin', admin)

// Rota para o acesso de usuarios
app.use('/usuarios', usuarios)

// Rota para a index de postagens
app.get('/', function (req, res) {
  Postagem.find().populate('categoria').sort({ data: 'desc' })
    .then(function (postagens) {
      res.render('index', { postagens: postagens })
    })
    .catch(function (erro) {
      req.flash('error_msg', 'Houve um erro interno!')
      res.redirect('/404')
    })
})

// Rota para o erro 404
app.get('/404', function (req, res) {
  res.send('Erro 404!')
})

// Rota para ler mais a postagem
app.get('/postagens/:slug', function (req, res) {
  Postagem.findOne({ slug: req.params.slug })
    .then(function (postagens) {
      if (postagens) {
        res.render('postagens/index', { postagens: postagens })
      } else {
        req.flash('error_msg', 'Essa postagem não existe!')
        res.redirect('/')
      }
    })
    .catch(function (erro) {
      req.flash('error_msg', 'Houve um erro interno!')
      res.redirect('/')
    })
})

// Rota para a pagina de lista de categorias para o navbar
app.get('/categorias', function (req, res) {
  Categoria.find()
    .then(function (categorias) {
      res.render('categorias/index', { categorias: categorias })
    })
    .catch(function (erro) {
      req.flash('error_msg', 'Houve um erro interno ao listar as categorias!')
      res.redirect('/')
    })
})

// Rota listar as postagens de uma categoria
app.get('/categorias/:slug', function (req, res) {
  Categoria.findOne({ slug: req.params.slug })
    .then(function (categoria) {
      if (categoria) {
        Postagem.find({ categoria: categoria._id })
          .then(function (postagens) {
            res.render('categorias/postagens', { postagens: postagens, categoria: categoria })
          })
          .catch(function (erro) {
            req.flash('error_msg', 'Houve um erro interno ao listar os posts!')
            res.redirect('/')
          })
      } else {
        req.flash('error_msg', 'Esta categoria não existe!')
        res.redirect('/')
      }
    })
    .catch(function (erro) {
      req.flash('error_msg', 'Houve um erro interno ao carregar a pagina dessa categoria!')
      res.redirect('/')
    })
})

// Outros
const PORT = process.env.PORT || 8081
app.listen(PORT, function () {
  console.log('Servidor rodando!')
})
