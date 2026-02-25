exports.permitirAcesso = (tiposPermitidos) => {
  return (req, res, next) => {
    const usuario = req.session.usuario;

    if (!usuario) {
      if (req.xhr || req.headers.accept.indexOf('json') > -1 || req.method !== 'GET') {
        return res.status(401).json({ 
          message: "Sua sessão expirou. Por favor, faça login novamente." 
        });
      }
      return res.redirect("/autenticacao/entrar");
    }

    if (!tiposPermitidos.includes(usuario.tipo_usuario)) {
      if (req.xhr || req.headers.accept.indexOf('json') > -1 || req.method !== 'GET') {
        return res.status(403).json({ 
          message: "Acesso negado: Você não tem permissão para realizar esta ação." 
        });
      }
    }

    next();
  };
};