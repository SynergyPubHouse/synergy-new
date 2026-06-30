function requireEditor(req, res, next) {
  if (!req.editor) {
    return res.status(403).json({
      success: false,
      message: "Editor authorization required",
    });
  }

  return next();
}

module.exports = requireEditor;
