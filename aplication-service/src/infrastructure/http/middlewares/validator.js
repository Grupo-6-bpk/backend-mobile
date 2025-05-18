import httpStatus from "http-status";

const config = {
  abortEarly: false,
  recursive: true,
};

export default (schema) => (req, res, next) => {
  try {
    schema.validateSync(req.body, config);
    next();
  } catch (err) {
    const errors = err.inner?.map(e => e.message) || [err.message];
    
    res
    .status(httpStatus.BAD_REQUEST)
    .send({
      message: `${errors.length} ${errors.length === 1 ? 'erro ocorreu' : 'erros ocorreram'}`,
      errors: errors,
    });
  }
}
