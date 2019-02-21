const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
require('../models/Usuario')
const Usuario = mongoose.model('usuarios')
const bcrypt = require('bcryptjs')
const passport = require('passport')

// Rota para a pagina de cadastro de usuario
router.get('/registro', function (req, res) {
  res.render('usuarios/registro')
})

// Rota para o envio do formulario de cadastro de usuario
router.post('/registro', function (req, res) {
  var erros = []

  if (!req.body.nome) {
    erros.push({ texto: 'Nome inválido' })
  }

  if (!req.body.email) {
    erros.push({ texto: 'Email inválido' })
  }

  if (!req.body.senha) {
    erros.push({ texto: 'Senha inválido' })
  }

  if (req.body.senha.length < 4) {
    erros.push({ texto: 'Senha muito curta' })
  }

  if (req.body.senha !== req.body.senha2) {
    erros.push({ texto: 'As senhas são diferentes, digite novamente' })
  }

  if (erros.length > 0) {
    res.render('usuarios/registro', { erros: erros })
  } else {
    Usuario.findOne({ email: req.body.email })
      .then(function (usuario) {
        if (usuario) {
          req.flash('error_msg', 'Já existe uma conta com esse email cadastrada em nosso sistema')
          res.redirect('usuarios/registro')
        } else {
          const novoUsuario = new Usuario({
            nome: req.body.nome,
            email: req.body.email,
            senha: req.body.senha
          })

          bcrypt.genSalt(10, function (erro, salt) {
            bcrypt.hash(novoUsuario.senha, salt, function (erro, hash) {
              if (erro) {
                req.flash('error_msg', 'Houve um erro durante o salvamento do usuário')
                res.redirect('/')
              } else {
                novoUsuario.senha = hash

                novoUsuario.save()
                  .then(function () {
                    req.flash('success_msg', 'Usuário criado com sucesso!')
                    res.redirect('/')
                  })
                  .catch(function (erro) {
                    req.flash('error_msg', 'Houve um erro ao criar o usuário, tente novamente')
                    res.redirect('/usuarios/registro')
                  })
              }
            })
          })
        }
      })
      .catch(function (erro) {
        req.flash('error_msg', 'Houve um erro interno!')
        res.redirect('/registro')
      })
  }
})

// Rota para login de usuario
router.get('/login', function (req, res) {
  res.render('usuarios/login')
})

// Rota para se autenticar
router.post('/login', function (req, res, next) {
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/usuarios/login',
    failureFlash: true
  })(req, res, next)
})

// Rota para fazer logout
router.get('/logout', function (req, res) {
  req.logout()
  req.flash('success_msg', 'Deslogado com sucesso')
  res.redirect('/')
})

module.exports = router
