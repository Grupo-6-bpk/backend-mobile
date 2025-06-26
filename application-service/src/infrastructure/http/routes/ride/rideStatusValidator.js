import yup from "yup";

export default yup
  .object()
  .shape({
    status: yup
      .string()
      .max(50, "Status deve ter no máximo 50 caracteres")
      .oneOf(["pending", "in_progress", "completed", "canceled"], "Status inválido")
      .required("Status é obrigatório")
  }).noUnknown(false);
