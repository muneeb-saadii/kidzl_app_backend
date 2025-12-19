// models/base_model.js

function successResponse(message, data) {
  return {
    result: "1",
    status: "success",
    message: message,
    data: data
  };
}

function errorResponse(message, data = {}) {
  return {
    result: "0",
    status: "error",
    message: message,
    data: data
  };
}

//
function successResponseModule(type, message, data) {
  return {
    result: "1",
    status: "success",
    message: message,
    user_type: type,
    data: data
  };
}

module.exports = {
  successResponse,
  successResponseModule,
  errorResponse
};
