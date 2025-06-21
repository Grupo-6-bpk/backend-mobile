import yup from "yup";

export default yup
  .object()
  .shape({
    stars: yup
      .number()
      .typeError("Estrelas devem ser um número")
      .integer("Estrelas devem ser um número inteiro")
      .min(1, "Avaliação deve ter pelo menos 1 estrela")
      .max(5, "Avaliação deve ter no máximo 5 estrelas")
      .required("Número de estrelas é obrigatório"),
    comment: yup
      .string()
      .max(500, "Comentário deve ter no máximo 500 caracteres"),
    rideId: yup
      .number()
      .typeError("ID da carona deve ser um número")
      .positive("ID da carona deve ser positivo")
      .integer("ID da carona deve ser um inteiro")
      .required("ID da carona é obrigatório"),
    reviewerId: yup
      .number()
      .typeError("ID do avaliador deve ser um número")
      .positive("ID do avaliador deve ser positivo")
      .integer("ID do avaliador deve ser um inteiro")
      .required("ID do avaliador é obrigatório"),
    revieweeId: yup
      .number()
      .typeError("ID do avaliado deve ser um número")
      .positive("ID do avaliado deve ser positivo")
      .integer("ID do avaliado deve ser um inteiro")
      .required("ID do avaliado é obrigatório")
  }).noUnknown(false);
