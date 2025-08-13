const asyncHandler = (requestHandler) => {
    (req , res , next) => {
        Promise.resolve(requestHandler(req , res , next)).catch((err) => (next))
    }
}

export {asyncHandler}


// // this is higher order function
// const asyncHandler = (fn) => async(req , res , next) => {
// try {
//     await fn(req , res , next)

// }
// catch (error) {
//     resizeBy.status(error.code || 500).json({
//         sucess : false,
//         message : message.error
//     })
// }
// }