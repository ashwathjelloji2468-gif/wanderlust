 class ExpressError extends Error {
  constructor(statusCode, message) {
    super(message); 
    this.statusCode = statusCode;
  }
}

// store in variable
const ErrorClass = ExpressError;

module.exports = ErrorClass;