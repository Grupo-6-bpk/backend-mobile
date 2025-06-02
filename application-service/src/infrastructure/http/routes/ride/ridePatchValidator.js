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
    distance: yup
      .number()
      .typeError("Distância deve ser um número")
      .positive("Distância deve ser positiva"),
    departureTime: yup
      .date()
      .typeError("Data de partida deve ser uma data válida"),
    fuelPrice: yup
      .number()
      .typeError("Preço do combustível deve ser um número")
      .positive("Preço do combustível deve ser positivo"),
    totalSeats: yup
      .number()
      .typeError("Número total de vagas deve ser um número")
      .positive("Número total de vagas deve ser positivo")
      .integer("Número total de vagas deve ser um inteiro")
      .min(1, "Deve haver pelo menos 1 vaga")
      .max(8, "Máximo de 8 vagas permitidas"),
    vehicleId: yup
      .number()
      .typeError("ID do veículo deve ser um número")
      .positive("ID do veículo deve ser positivo")
      .integer("ID do veículo deve ser um inteiro")
  }).noUnknown(false);
