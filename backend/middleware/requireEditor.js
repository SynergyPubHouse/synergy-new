function requireEditor(req, res, next) {
  const isEditorUser =
    Array.isArray(req.user?.roles) && req.user.roles.includes("editor");

  if (!req.editor && !isEditorUser) {
    return res.status(403).json({
      success: false,
      message: "Editor authorization required",
    });
  }

  if (!req.editor && isEditorUser) {
    req.editor = req.user;
  }

  return next();
}

module.exports = requireEditor;
