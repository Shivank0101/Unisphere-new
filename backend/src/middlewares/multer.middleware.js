import multer from "multer";

// below is the configuration for multer
//This defines how and where to store uploaded files. meaning that the files will be stored in the public/temp folder with the original name of the file
const storage = multer.diskStorage({
    destination: function (req, file, cb) { // cb is callback function which is used to pass the destination and filename to multer
      cb(null, "./public/temp") // null means no error 
    },
    filename: function (req, file, cb) {
      
      cb(null, file.originalname)// null means no error and file.originalname is the name of the file which is uploaded by the user
    }
  })
  
export const upload = multer({ 
    storage, 
})

// multer is a node js middleware for handling multipart/form-data, which is used for uplaoding files
//khohojoj /oppijoiu 