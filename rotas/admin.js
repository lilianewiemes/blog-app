const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')

require('../models/Categoria')
const Categoria = mongoose.model('categorias')

require('../models/Postagem')
const Postagem = mongoose.model('postagens')
const { eAdmin } = require('../helpers/eAdmin')

require('../models/Usuario')
const Usuario = mongoose.model('usuarios')
const bcrypt = require('bcryptjs')

// Rota para pagina index
router.get('/', eAdmin, function (req, res) {
  res.render('admin/index')
})

// Rota para pagina de posts
router.get('/posts', eAdmin, function (req, res) {
  res.send('Pagina de posts')
})

// Rota para pagina de lista de categorias
router.get('/categorias', eAdmin, function (req, res) {
  Categoria.find().sort({ data: 'desc' })
    .then(function (categorias) {
      res.render('admin/categorias', { categorias: categorias })
    })
    .catch(function (erro) {
      req.flash('error_msg', 'Houve um erro ao listar as categorias')
      res.redirect('/admin')
    })
})

// Rota para a pagina de adicionar categorias
router.get('/categorias/add', eAdmin, function (req, res) {
  res.render('admin/addcategorias')
})

// Rota para a criação da nova categoria
router.post('/categorias/nova', eAdmin, function (req, res) {
  var erros = []

  if (!req.body.nome) {
    erros.push({ texto: 'Nome inválido!' })
  }

  if (!req.body.slug) {
    erros.push({ texto: 'Slug inválido!' })
  }

  if (req.body.nome.length < 2) {
    erros.push({ texto: 'O nome da categoria é muito pequena' })
  }

  if (erros.length > 0) {
    res.render('admin/addcategorias', { erros: erros })
  } else {
    const novaCategoria = {
      nome: req.body.nome,
      slug: req.body.slug
    }

    new Categoria(novaCategoria).save()
      .then(function () {
        req.flash('success_msg', 'Categoria criada com sucesso!')
        res.redirect('/admin/categorias')
      })
      .catch(function (erro) {
        req.flash('error_msg', 'Houve um erro ao salvar a categoria, tente novamente.')
        res.redirect('/admin')
      })
  }
})

// Rota para ir para a pagina de edição da categoria
router.get('/categorias/edit/:id', eAdmin, function (req, res) {
  Categoria.findOne({ _id: req.params.id })
    .then(function (categoria) {
      res.render('admin/editcategorias', { categoria: categoria })
    })
    .catch(function (erro) {
      req.flash('error_msg', 'Esta categoria não existe')
      res.redirect('/admin/categorias')
    })
})

// Rota para editar categoria
router.post('/categorias/edit', eAdmin, function (req, res) {
  Categoria.findOne({ _id: req.body.id })
    .then(function (categoria) {
      categoria.nome = req.body.nome
      categoria.slug = req.body.slug

      categoria.save()
        .then(function () {
          req.flash('success_msg', 'Categoria editada com sucesso!')
          res.redirect('/admin/categorias')
        })
        .catch(function (erro) {
          req.flash('error_msg', 'Houve um erro interno ao tentar salvar a categoria!')
          res.redirect('/admin/categorias')
        })
    })
    .catch(function (erro) {
      req.flash('error_msg', 'Houve um erro ao tentar salvar a categoria!')
      res.redirect('/admin/categorias')
      console.log(erro)
    })
})

// Rota para excluir categoria
router.post('/categorias/deletar', eAdmin, function (req, res) {
  Categoria.remove({ _id: req.body.id })
    .then(function () {
      req.flash('success_msg', 'Categoria deletada com sucesso!')
      res.redirect('/admin/categorias')
    })
    .catch(function (erro) {
      req.flash('error_msg', 'Houve um erro ao tentar deletar a categoria!')
      res.redirect('/admin/categorias')
    })
})

// Rota para a pagina de lista de postagens
router.get('/postagens', eAdmin, function (req, res) {
  Postagem.find().populate('categoria').sort({ data: 'desc' })
    .then(function (postagens) {
      res.render('admin/postagens', { postagens: postagens })
    })
    .catch(function (erro) {
      res.flash('error_msg', 'Houve um erro ao listar as postagens!')
      req.redirect('/admin')
    })
})

// Rota para a pagina de adicionar postagens
router.get('/postagens/add', eAdmin, function (req, res) {
  Categoria.find()
    .then(function (categorias) {
      res.render('admin/addpostagens', { categorias: categorias })
    })
    .catch(function (erro) {
      res.flash('error_msg', 'Houve um erro ao exibir as categorias')
      req.redirect('/admin')
    })
})

// Rota para adicionar postagem
router.post('/postagens/nova', eAdmin, function (req, res) {
  var erros = []

  if (req.body.categoria === 0) {
    erros.push({ texto: 'Categoria inválida, registre uma categoria' })
  }

  if (erros.length > 0) {
    res.render('admin/addpostagens', { erros: erros })
  } else {
    const novaPostagem = {
      titulo: req.body.titulo,
      slug: req.body.slug,
      conteudo: req.body.conteudo,
      categoria: req.body.categoria
    }

    new Postagem(novaPostagem).save()
      .then(function () {
        req.flash('success_msg', 'Nova postagem adicionada com sucesso!')
        res.redirect('/admin/postagens')
      })
      .catch(function (erro) {
        req.flash('error_msg', 'Houve um erro ao tentar adicionar uma nova postagem!')
        res.redirect('/admin/postagens')
      })
  }
})

// Rota para a pagina de editar postagens
router.get('/postagens/edit/:id', eAdmin, function (req, res) {
  Postagem.findOne({ _id: req.params.id })
    .then(function (postagem) {
      Categoria.find()
        .then(function (categorias) {
          res.render('admin/editpostagens', { postagem: postagem, categorias: categorias })
        })
        .catch(function (erro) {
          req.flash('error_msg', 'Houve um erro interno ao tentar editar uma postagem!')
          res.redirect('/admin/postagens')
        })
    })
    .catch(function (erro) {
      req.flash('error_msg', 'Houve um erro ao tentar editar uma postagem!')
      res.redirect('/admin/postagens')
    })
})

// Rota para editar a postagem
router.post('/postagens/edit', eAdmin, function (req, res) {
  Postagem.findOne({ _id: req.body.id })
    .then(function (postagem) {
      postagem.titulo = req.body.titulo
      postagem.slug = req.body.slug
      postagem.conteudo = req.body.conteudo
      postagem.categoria = req.body.categoria

      postagem.save()
        .then(function () {
          req.flash('success_msg', 'Postagem editada com sucesso!')
          res.redirect('/admin/postagens')
        })
        .catch(function (erro) {
          req.flash('error_msg', 'Houve um erro interno ao tentar editar uma postagem!')
          res.redirect('/admin/postagens')
        })
    })
    .catch(function (erro) {
      req.flash('error_msg', 'Houve um erro ao tentar editar uma postagem!')
      res.redirect('/admin/postagens')
    })
})

// Rota para deletar postagens
router.get('/postagens/deletar/:id', eAdmin, function (req, res) {
  Postagem.remove({ _id: req.params.id })
    .then(function () {
      req.flash('success_msg', 'Postagem deletada com sucesso!')
      res.redirect('/admin/postagens')
    })
    .catch(function (erro) {
      req.flash('error_msg', 'Houve um erro ao tentar deletar uma postagem!')
      res.redirect('/admin/postagens')
    })
})

// Rota para exibir todos os usuarios
router.get('/usuarios', eAdmin, function (req, res) {
  Usuario.find().populate('usuarios').sort({ nome: 'asc' })
    .then(function (usuarios) {
      res.render('admin/usuarios', { usuarios: usuarios })
    })
    .catch(function (erro) {
      res.flash('error_msg', 'Houve um erro ao listar os usuários!')
      req.redirect('/admin')
    })
})

// Rota para a pagina de editar o usuário
router.get('/usuarios/edit/:id', eAdmin, function (req, res) {
  Usuario.findOne({ _id: req.params.id })
    .then(function (usuario) {
      res.render('admin/editusuarios', { usuario: usuario })
    })
    .catch(function (erro) {
      req.flash('error_msg', 'Houve um erro ao tentar editar um usuários!')
      res.redirect('/admin/usuarios')
    })
})

// Rota para editar o usuario
router.post('/usuarios/edit', eAdmin, function (req, res) {
  Usuario.findOne({ _id: req.body.id })
    .then(function (usuario) {
      usuario.nome = req.body.nome
      usuario.senha = req.body.senha
      usuario.email = req.body.email
      usuario.eAdmin = req.body.eAdmin

      bcrypt.genSalt(10, function (erro, salt) {
        bcrypt.hash(usuario.senha, salt, function (erro, hash) {
          if (erro) {
            req.flash('error_msg', 'Houve um erro durante o salvamento do usuário')
            res.redirect('/')
          } else {
            usuario.senha = hash

            usuario.save()
              .then(function () {
                req.flash('success_msg', 'Usuário alterado com sucesso!')
                res.redirect('/')
              })
              .catch(function (erro) {
                req.flash('error_msg', 'Houve um erro ao editar o usuário, tente novamente')
                res.redirect('/admin/usuarios')
              })
          }
        })
      })
    })
})

// Rota para deletar usuario
router.get('/usuarios/deletar/:id', function (req, res) {
  Usuario.remove({ _id: req.params.id })
    .then(function () {
      req.flash('success_msg', 'Usuário deletado com sucesso!')
      res.redirect('/admin/usuarios')
    })
    .catch(function (erro) {
      req.flash('error_msg', 'Houve um erro ao tentar deletar um usuário!')
      res.redirect('/admin/usuarios')
    })
})

module.exports = router
