import yup from "yup";

export default yup
  .object()
  .shape({
    email:
      yup
        .string()
        .trim()
        .required("Email é obrigatório"),
    password:
      yup
        .string()
        .required("Senha é obrigatória"),
  }).noUnknown(false); 
