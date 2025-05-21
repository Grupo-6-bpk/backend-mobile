import yup from "yup";

export default yup
  .object()
  .shape({
        name: yup
          .string()
          .min(2, "Nome deve ter pelo menos 2 caracteres")
          .max(255, "Nome deve ter no máximo 255 caracteres")
          .required("Nome é obrigatório"),
        last_name: yup
          .string()
          .min(2, "Sobrenome deve ter pelo menos 2 caracteres")
          .max(255, "Sobrenome deve ter no máximo 255 caracteres")
          .required("Sobrenome é obrigatório"),
        email: yup
          .string()
          .email("Email inválido")
          .max(255, "Email deve ter no máximo 255 caracteres")
          .matches(/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/, "Formato de email inválido"),
        password: yup
          .string()
          .min(8, "Senha deve ter pelo menos 8 caracteres")
          .max(255, "Senha deve ter no máximo 255 caracteres")
          .required("Senha é obrigatória"),
        cpf: yup
          .string()
          .max(45, "CPF deve ter no máximo 45 caracteres")
          .matches(/^\d{3}\.\d{3}\.\d{3}\-\d{2}$/, "CPF inválido (formato: 123.456.789-00)"),
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
        city: yup
          .string()
          .max(45, "Cidade deve ter no máximo 45 caracteres"),
        zipcode: yup
          .string()
          .max(45, "CEP deve ter no máximo 45 caracteres"),        verified: yup
          .boolean(),
        active: yup
          .boolean(),
        isDriver: yup
          .boolean(),
        isPassenger: yup
          .boolean()
  }).noUnknown(false);

