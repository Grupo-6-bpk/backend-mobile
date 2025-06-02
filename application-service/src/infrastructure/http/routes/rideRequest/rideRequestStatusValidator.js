import yup from "yup";

export default yup
  .object()
  .shape({
    status: yup
      .string()
      .max(255, "Status deve ter no máximo 255 caracteres")
      .oneOf(["PENDING", "APPROVED", "REJECTED", "CANCELLED"], "Status inválido")
      .required("Status é obrigatório")
  }).noUnknown(false);