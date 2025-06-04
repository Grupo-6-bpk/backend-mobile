import * as yup from 'yup';

export const createGroupSchema = yup.object().shape({
    name: yup.string()
        .required('Nome do grupo é obrigatório'),
    description: yup.string()
        .optional()
        .nullable()
        .default(''),
    members: yup.array()
        .min(1, 'O grupo deve ter no mínimo 1 membro.')
        .max(5, 'O grupo deve ter no máximo 5 membros.')
        .required('Membros são obrigatórios')
});

export const validate = (schema, property = 'body') => {
    return async (req, res, next) => {
        try {
            const validatedData = await schema.validate(req[property], {
                abortEarly: false,
                stripUnknown: true,
            });
            req[property] = validatedData;
            next();
        } catch (error) {
            if (error instanceof yup.ValidationError) {
                const errors = error.inner.map(err => ({
                    field: err.path,
                    message: err.message,
                }));
                return res.status(400).json({
                    message: 'Erro de validação.',
                    errors: errors.length > 0 ? errors : [{ field: error.path, message: error.message }],
                });
            }
            console.error("Erro de validação inesperado:", error);
            res.status(500).json({ message: 'Erro interno no servidor durante a validação.' });
        }
    };
};
