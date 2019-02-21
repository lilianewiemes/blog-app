const LocalStrategy = require('passport-local').Strategy
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('../models/Usuario')
const Usuario = mongoose.model('usuarios')

module.exports = function (passport) {
  passport.use(new LocalStrategy({ usernameField: 'email', passwordField: 'senha' }, function (email, senha, done) {
    Usuario.findOne({ email: email })
      .then(function (usuario) {
        if (!usuario) {
          return done(null, false, { message: 'Esta conta não existe' })
        } else {
          bcrypt.compare(senha, usuario.senha, function (erro, senhasIguais) {
            if (senhasIguais) {
              return done(null, usuario)
            } else {
              return done(null, false, { message: 'Senha incorreta' })
            }
          })
        }
      })
      .catch(function (erro) {
        console.log(erro)
      })
  }))

  passport.serializeUser(function (usuario, done) {
    done(null, usuario.id)
  })

  passport.deserializeUser(function (id, done) {
    Usuario.findById(id, function (erro, usuario) {
      done(erro, usuario)
    })
  })
}
