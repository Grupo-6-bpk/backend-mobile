import yup from "yup";

export default yup
  .object()
  .shape({
    stars: yup
      .number()
      .typeError("Estrelas devem ser um número")
      .integer("Estrelas devem ser um número inteiro")
      .min(1, "Avaliação deve ter pelo menos 1 estrela")
      .max(5, "Avaliação deve ter no máximo 5 estrelas"),
    comment: yup
      .string()
      .max(500, "Comentário deve ter no máximo 500 caracteres")
  }).noUnknown(false);
