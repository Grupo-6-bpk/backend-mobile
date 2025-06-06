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
    distance: yup
      .number()
      .typeError("Distância deve ser um número")
      .positive("Distância deve ser positiva")
      .required("Distância é obrigatória"),
    departureTime: yup
      .date()
      .typeError("Data de partida deve ser uma data válida")
      .required("Data de partida é obrigatória"),
    fuelPrice: yup
      .number()
      .typeError("Preço do combustível deve ser um número")
      .positive("Preço do combustível deve ser positivo")
      .required("Preço do combustível é obrigatório"),
    totalSeats: yup
      .number()
      .typeError("Número total de vagas deve ser um número")
      .positive("Número total de vagas deve ser positivo")
      .integer("Número total de vagas deve ser um inteiro")
      .min(1, "Deve haver pelo menos 1 vaga")
      .max(8, "Máximo de 8 vagas permitidas")
      .required("Número total de vagas é obrigatório"),
    driverId: yup
      .number()
      .typeError("ID do motorista deve ser um número")
      .positive("ID do motorista deve ser positivo")
      .integer("ID do motorista deve ser um inteiro")
      .required("ID do motorista é obrigatório"),
    vehicleId: yup
      .number()
      .typeError("ID do veículo deve ser um número")
      .positive("ID do veículo deve ser positivo")
      .integer("ID do veículo deve ser um inteiro")
      .required("ID do veículo é obrigatório")
  }).noUnknown(false);
