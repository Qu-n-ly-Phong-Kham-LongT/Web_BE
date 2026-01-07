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