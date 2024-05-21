// hm yaha ka code direct app.js me vi likh skate hai .
// Modularity ke liye hm yaha likh rahe hai.
// Taki hme agar koi function pass kare to hm yaha se error handling shai se kr sake.

//* The main purpose of asyncHandler is to handle errors in asynchronous route handlers more efficiently and elegantly. It ensures that any errors thrown in the async functions are properly caught and passed to the next middleware, typically the error handling middleware. This approach leads to cleaner, more maintainable, and more consistent error handling in your Express application. 

//** TWO WAYS TO CALL: */

// 1. TRY CATCH BLOCK:

// const asyncHandler = (fn) => async(req,res,next) => {
//     try{
//         await fn(req,res,next)
//     }catch(err){
//         console.log("Error in asyncHanddler file : ",err);
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }

// 2. PROMISE :

const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
            .catch((err) => next(err))
    } 
}


export { asyncHandler }