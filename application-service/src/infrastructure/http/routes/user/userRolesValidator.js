import yup from "yup";

export default yup
  .object()
  .shape({
    isDriver: yup
      .boolean()
      .required("O campo isDriver é obrigatório"),
    isPassenger: yup
      .boolean()
      .required("O campo isPassenger é obrigatório"),
  }).noUnknown(false);
