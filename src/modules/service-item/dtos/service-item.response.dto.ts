import Joi from "joi";

export interface ServiceItemResponseDto {
  itemId: string;
  itemCode: string;
  name: string;
  unit: string;       
  specimen: string;   
  prepNote: string;    
  isActive: boolean;
  
  categoryName: string; 
  typeName: string;    
  
  basePrice: number; 
  
  configs: ServiceItemConfigDto[];
}

export interface ServiceItemConfigDto {
  configId: string;
  configCode: string;
  displayName: string;
  inputType: string; 
  unit: string;       
  refRange: string;

  metaData: {
    uiStyle: string;    
    allowMultiple: boolean;
    options: ServiceOptionDto[];
    defaultValue?: any;
  };
}

export interface ServiceOptionDto {
  label: string;     
  value: string;     
  surcharge: number;
}

export const ServiceOptionResponseSchema = Joi.object<ServiceOptionDto>({
  label: Joi.string().required(),
  value: Joi.string().required(),
  surcharge: Joi.number().required(),
}).required();

export const ServiceItemConfigResponseSchema = Joi.object<ServiceItemConfigDto>({
  configId: Joi.string().required(),
  configCode: Joi.string().required(),
  displayName: Joi.string().required(),
  inputType: Joi.string().required(),
  unit: Joi.string().required(),
  refRange: Joi.string().required(),
  metaData: Joi.object({
    uiStyle: Joi.string().required(),
    allowMultiple: Joi.boolean().required(),
    options: Joi.array().items(ServiceOptionResponseSchema).required(),
    defaultValue: Joi.any().optional(),
  }).required(),
}).required();

export const ServiceItemResponseSchema = Joi.object<ServiceItemResponseDto>({
  itemId: Joi.string().required(),
  itemCode: Joi.string().required(),
  name: Joi.string().required(),
  unit: Joi.string().required(),
  specimen: Joi.string().required(),
  prepNote: Joi.string().required(),
  isActive: Joi.boolean().required(),
  categoryName: Joi.string().required(),
  typeName: Joi.string().required(),
  basePrice: Joi.number().required(),
  configs: Joi.array().items(ServiceItemConfigResponseSchema).required(),
}).required();
