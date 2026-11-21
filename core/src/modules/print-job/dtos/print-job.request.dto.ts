import Joi from "joi";

export const PrintJobIdParamSchema = Joi.object({
  jobId: Joi.string().guid().required(),
});
