export interface SelectedConfigsDto {
    configId: string;
    configCode: string;
    selectedOptions: string[];
    totalCost: number;
}

export interface CreateServiceRequestDetailDto {
    itemId: string;
    itemCode: string;
    name: string;
    selectedOptions: SelectedConfigsDto[];
    note?: string;
}

export interface CreateServiceRequestDto {
    recordId: string;
    orderingDocterId: string;
    details: CreateServiceRequestDetailDto[];
    
}