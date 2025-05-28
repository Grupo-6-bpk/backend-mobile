import yup from "yup";

export default yup
  .object()
  .shape({
    startLocation: yup
      .string()
      .max(255, "Localização de origem deve ter no máximo 255 caracteres")
      .required("Localização de origem é obrigatória"),
    endLocation: yup
      .string()
      .max(255, "Localização de destino deve ter no máximo 255 caracteres")
      .required("Localização de destino é obrigatória"),
    status: yup
      .string()
      .max(255, "Status deve ter no máximo 255 caracteres")
      .oneOf(["PENDING", "APPROVED", "REJECTED", "CANCELLED"], "Status inválido"),
    passengerShare: yup
      .number()
      .typeError("Valor deve ser um número")
      .positive("Valor deve ser positivo"),
    rideId: yup
      .number()
      .typeError("ID da carona deve ser um número")
      .positive("ID da carona deve ser positivo")
      .integer("ID da carona deve ser um inteiro")
      .required("ID da carona é obrigatório"),
    passengerId: yup
      .number()
      .typeError("ID do passageiro deve ser um número")
      .positive("ID do passageiro deve ser positivo")
      .integer("ID do passageiro deve ser um inteiro")
      .required("ID do passageiro é obrigatório")
  }).noUnknown(false);
