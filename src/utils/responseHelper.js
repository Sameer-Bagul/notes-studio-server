export const successResponse = (data, message, pagination) => ({
  success: true,
  message,
  data,
  pagination
});

export const errorResponse = (error, message) => ({
  success: false,
  message,
  error
});

export const sendSuccessResponse = (res, data, message, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

export const sendErrorResponse = (res, error, statusCode = 400, message) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error
  });
};

export const paginationHelper = (page, limit, total) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit)
});
