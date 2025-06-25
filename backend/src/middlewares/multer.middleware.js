import multer from 'multer';

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, "./public/temp")
    },
    filename: function(req, file, cb) {
        // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.originalname) //file ko original name batai save hunxa but yo prefer type hoina 
    }
})

export const upload = multer({ storage })