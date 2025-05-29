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
    phone: yup
      .string()
      .max(45, "Telefone deve ter no máximo 45 caracteres"),
    street: yup
      .string()
      .max(45, "Endereço deve ter no máximo 45 caracteres"),
    number: yup
      .number()
      .typeError("Número deve ser um valor numérico")
      .positive("Número deve ser positivo")
      .integer("Número deve ser um inteiro"),
    renavam: yup
      .string()
      .matches(/^[0-9]{11}$/, "RENAVAM inválido (deve conter 11 dígitos)")
      .required("RENAVAM é obrigatório"),
    plate: yup
      .string()
      .matches(/^[A-Z]{3}[0-9]{4}$|^[A-Z]{3}[0-9]{1}[A-Z]{1}[0-9]{2}$/, "Placa inválida (formato: ABC1234 ou ABC1D23)")
      .required("Placa é obrigatória"),
    fuelConsumption: yup
      .number()
      .typeError("Consumo de combustível deve ser um valor numérico")
      .positive("Consumo de combustível deve ser positivo")
      .required("Consumo de combustível é obrigatório"),
    driverId: yup
      .number()
      .typeError("ID do motorista deve ser um valor numérico")
      .positive("ID do motorista deve ser positivo")
      .integer("ID do motorista deve ser um inteiro")
      .required("ID do motorista é obrigatório")
  }).noUnknown(false);
