import httpStatus from "http-status";

const config = {
  abortEarly: false,
  recursive: true,
};

export default (schema) => (req, res, next) => {
  try {
    console.log('Validating request body:', JSON.stringify(req.body));
    schema.validateSync(req.body, config);
    next();
  } catch (err) {
    const { message, errors } = err;
    console.log('Validation error:', message, errors);

    res
    .status(httpStatus.BAD_REQUEST)
    .send({
      message,
      errors,
    });
  }
}
