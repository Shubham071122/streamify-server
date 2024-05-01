import multer from 'multer';
const storage = multer.diskStorage({

    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
    //   const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.originalname)//file ke sath or vi function h sirf (originalname) use krna efficent nahi h
    }
  })
  
  export const upload = multer({
     storage,
  })