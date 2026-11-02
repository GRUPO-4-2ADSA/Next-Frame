var multer = require("multer");
var path = require("path");

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/assets/img/perfis");
    },
    filename: function (req, file, cb) {
        var nomeArquivo = Date.now() + path.extname(file.originalname);
        cb(null, nomeArquivo);
    }
});

var upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

function fileFilter(req, file, cb) {
    var tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];

    if (tiposPermitidos.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Formato de imagem não permitido!"), false);
    }
}

module.exports = upload;