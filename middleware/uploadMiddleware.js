const multer = require('multer');
const path = require('path');

// Switch to memory storage to debug disk write crashes
const storage = multer.memoryStorage();

/*
const storage = multer.diskStorage({
    destination(req, file, cb) {
        const uploadPath = path.resolve(__dirname, '..', 'uploads');
        // Ensure directory exists synchronously to be safe
        const fs = require('fs');
        if (!fs.existsSync(uploadPath)){
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        console.log('MULTER: Saving file to:', uploadPath);
        cb(null, uploadPath);
    },
    filename(req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
});
*/

function checkFileType(file, cb) {
    // Relaxed filter for debugging
    const filetypes = /jpg|jpeg|png|webp|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Mimetype check can sometimes be tricky with some OS/browsers, logging it
    console.log('MULTER: Checking file:', file.originalname, 'Mimetype:', file.mimetype);
    
    if (extname) {
        return cb(null, true);
    } else {
        cb('Images only!');
    }
}

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        // Bypass filter completely to test connection stability
        console.log('MULTER: Bypassing filter for:', file.originalname);
        cb(null, true);
    },
});

module.exports = upload;
