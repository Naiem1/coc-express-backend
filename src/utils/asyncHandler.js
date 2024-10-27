/** there are two type of create async handler function
 * 1. asyncHandler(fn) - using try catch block to handle errors
 * 2. asyncHandler(fn, cb) - using Promose.catch() function to handle errors
 */

// * 2. asyncHandler(fn) - using Promose.catch() function to handle errors
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error) =>
      next(error)
    );
  };
};

export { asyncHandler };

// * 1. asyncHandler(fn) - using try catch block to handle errors

/**
  const asyncHandler = () => { };
  const asyncHandler = (func) => {
    return async () => {}
  }
 */

/* 
  const asyncHandler = (fn) => { };
  const asyncHandler = (fn) => () => {};
  const asyncHandler = (fn) => async() => {};
*/

/* const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
}; */
