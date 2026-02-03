import { NodeType, ServiceNode } from "@prisma/client";
import { BaseError } from "../../../utils/base-error.util";
import { ServiceNodeRepository } from "../repositories/service-node.repository";
import {
  CreateServiceNodeRequestDto,
  UpdateServiceNodeRequestDto,
} from "../dtos/service-node.request.dto";
import { createPagination } from "../../../utils/pagination.util";

export class ServiceNodeService {
  private repo = new ServiceNodeRepository();

  public async create(dto: CreateServiceNodeRequestDto) {
    const normalizedParentId = this.normalizeParentId(dto.parentId);
    await this.ensureCodeUnique(dto.code);
    await this.validateParent(dto.nodeType, normalizedParentId);
    return this.repo.create({ ...dto, parentId: normalizedParentId });
  }

  public async update(nodeId: string, dto: UpdateServiceNodeRequestDto) {
    const existing = await this.repo.findById(nodeId);
    if (!existing) throw new BaseError(404, "Không tìm thấy dịch vụ này");

    if (dto.code && dto.code !== existing.code) {
      await this.ensureCodeUnique(dto.code, nodeId);
    }

    const nextNodeType = dto.nodeType ?? existing.nodeType ?? null;
    const normalizedParentId =
      dto.parentId === undefined
        ? undefined
        : this.normalizeParentId(dto.parentId);
    const nextParentId =
      normalizedParentId === undefined ? existing.parentId : normalizedParentId;

    await this.validateParent(nextNodeType, nextParentId, nodeId);

    return this.repo.update(nodeId, { ...dto, parentId: normalizedParentId });
  }

  public async list(
    page: number = 1,
    size: number = 10,
    nodeType?: NodeType,
    isActive?: boolean,
    search?: string,
  ): Promise<{
    nodes: ServiceNode[];
    pagination: ReturnType<typeof createPagination>;
  }> {
    const safePage = Math.max(page, 1);
    const safeSize = Math.max(size, 1);
    const normalizedIsActive = isActive;

    const normalizedSearch = search?.trim() || undefined;

    const { nodes, totalItems } = await this.repo.findAll(
      safePage,
      safeSize,
      nodeType,
      normalizedIsActive,
      normalizedSearch,
    );

    return {
      nodes,
      pagination: createPagination(safePage, safeSize, totalItems),
    };
  }

  public getNodeTypes(): NodeType[] {
    return Object.values(NodeType);
  }

  private async ensureCodeUnique(code: string, excludeId?: string) {
    const exists = await this.repo.existsByCode(code, excludeId);
    if (exists) throw new BaseError(400, "Mã code này đã tồn tại");
  }

  private normalizeParentId(
    parentId?: string | null,
  ): string | null | undefined {
    if (parentId === undefined) return undefined;
    if (parentId === null || parentId === "") return null;
    return parentId;
  }

  private async validateParent(
    nodeType: NodeType | null,
    parentId?: string | null,
    selfId?: string,
  ) {
    if (!nodeType) return;

    const normalizedParentId = this.normalizeParentId(parentId);

    if (nodeType === NodeType.CATEGORY) {
      if (normalizedParentId) {
        throw new BaseError(400, "Danh mục không cần parentId");
      }
      return;
    }

    if (!normalizedParentId) {
      throw new BaseError(400, "Dịch vụ phải có danh mục");
    }

    if (selfId && normalizedParentId === selfId) {
      throw new BaseError(
        400,
        "Dịch vụ không thể là danh mục cha của chính nó",
      );
    }

    const parent = await this.repo.findById(normalizedParentId);
    if (!parent) throw new BaseError(404, "Danh mục không tồn tại");
    if (parent.nodeType !== NodeType.CATEGORY) {
      throw new BaseError(400, "Dịch vụ phải gắn vào Danh mục");
    }
  }

  public async listTypesByCategory(categoryId: string): Promise<ServiceNode[]> {
    const category = await this.repo.findById(categoryId);
    if (!category || category.nodeType !== NodeType.CATEGORY) {
      throw new BaseError(404, "Danh mục không tồn tại");
    }
    return this.repo.findByParentId(categoryId);
  }
}

