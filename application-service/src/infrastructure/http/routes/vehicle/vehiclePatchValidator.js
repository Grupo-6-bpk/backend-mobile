import yup from "yup";

export default yup
  .object()
  .shape({
    model: yup
      .string()
      .min(2, "Modelo deve ter pelo menos 2 caracteres")
      .max(255, "Modelo deve ter no máximo 255 caracteres"),
    brand: yup
      .string()
      .min(2, "Marca deve ter pelo menos 2 caracteres")
      .max(255, "Marca deve ter no máximo 255 caracteres"),
    year: yup
      .number()
      .typeError("Ano deve ser um valor numérico")
      .positive("Ano deve ser positivo")
      .integer("Ano deve ser um inteiro"),
    color: yup
      .string()
      .min(2, "Cor deve ter pelo menos 2 caracteres")
      .max(100, "Cor deve ter no máximo 100 caracteres"),
    renavam: yup
      .string()
      .matches(/^[0-9]{11}$/, "RENAVAM inválido (deve conter 11 dígitos)"),
    plate: yup
      .string()
      .matches(/^[A-Z]{3}[0-9]{4}$|^[A-Z]{3}[0-9]{1}[A-Z]{1}[0-9]{2}$/, "Placa inválida (formato: ABC1234 ou ABC1D23)"),
    fuelConsumption: yup
      .number()
      .typeError("Consumo de combustível deve ser um valor numérico")
      .positive("Consumo de combustível deve ser positivo"),
    carImageUrl: yup
      .string()
      .url("URL da imagem do carro deve ser uma URL válida")
      .max(500, "URL da imagem deve ter no máximo 500 caracteres"),
    driverId: yup
      .number()
      .typeError("ID do motorista deve ser um valor numérico")
      .positive("ID do motorista deve ser positivo")
      .integer("ID do motorista deve ser um inteiro")
  }).noUnknown(false);
