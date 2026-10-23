
export const response = (res, data, message = 'done', status = 200) => {
   res.status(status).json({
    message,
    data
   })
} 