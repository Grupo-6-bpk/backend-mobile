import yup from "yup";

export default yup
  .object()
  .shape({
    startLocation: yup
      .string()
      .max(255, "Localização de origem deve ter no máximo 255 caracteres"),
    endLocation: yup
      .string()
      .max(255, "Localização de destino deve ter no máximo 255 caracteres"),
    status: yup
      .string()
      .max(255, "Status deve ter no máximo 255 caracteres")
      .oneOf(["PENDING", "APPROVED", "REJECTED", "CANCELLED"], "Status inválido"),
    passengerShare: yup
      .number()
      .typeError("Valor deve ser um número")
      .positive("Valor deve ser positivo")
  }).noUnknown(false);
