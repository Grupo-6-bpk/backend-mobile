import yup from "yup";

export default yup
  .object()
  .shape({
    model: yup
      .string()
      .min(2, "Modelo deve ter pelo menos 2 caracteres")
      .max(255, "Modelo deve ter no máximo 255 caracteres")
      .required("Modelo é obrigatório"),
    brand: yup
      .string()
      .min(2, "Marca deve ter pelo menos 2 caracteres")
      .max(255, "Marca deve ter no máximo 255 caracteres")
      .required("Marca é obrigatória"),
    year: yup
      .number()
      .typeError("Ano deve ser um valor numérico")
      .positive("Ano deve ser positivo")
      .integer("Ano deve ser um inteiro")
      .required("Ano é obrigatório"),
    color: yup
      .string()
      .min(2, "Cor deve ter pelo menos 2 caracteres")
      .max(100, "Cor deve ter no máximo 100 caracteres")
      .required("Cor é obrigatória"),
    renavam: yup
      .string()
      .required("RENAVAM é obrigatório"),
    plate: yup
      .string()
      .required("Placa é obrigatória"),
    fuelConsumption: yup
      .number()
      .typeError("Consumo de combustível deve ser um valor numérico")
      .positive("Consumo de combustível deve ser positivo")
      .required("Consumo de combustível é obrigatório"),
    carImageUrl: yup
      .string()
      .url("URL da imagem do carro deve ser uma URL válida")
      .max(500, "URL da imagem deve ter no máximo 500 caracteres"),
    driverId: yup
      .number()
      .typeError("ID do motorista deve ser um valor numérico")
      .positive("ID do motorista deve ser positivo")
      .integer("ID do motorista deve ser um inteiro")
      .required("ID do motorista é obrigatório")
  }).noUnknown(false);
