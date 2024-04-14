# This folder show you how you connect mongodb with express.

# 1. For connecting with database there is two approch .
1. Make all things inside index.js folder using iffi function.

2. Make seperate folder for databse connection like inside db folder.

3. we use :
dotenv.config({
    path: './env'
})

-- this to handle env file.
--to use this dotenv we have to change some experiment in script in package.json file
 -> nodemon -r dotenv/config --experimental-json-modules

** more details go inside index.js file.
#
# 2. Custom api Error handling.



