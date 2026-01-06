import { ServiceNode, NodeType } from "@prisma/client";
import { prisma } from "../../../config/database.config";
import {
  CreateServiceNodeRequestDto,
  UpdateServiceNodeRequestDto,
} from "../dtos/service-node.request.dto";

export class ServiceNodeRepository {
  public async create(data: CreateServiceNodeRequestDto): Promise<ServiceNode> {
    return prisma.serviceNode.create({
      data: {
        nodeType: data.nodeType,
        parentId: data.parentId ? data.parentId : null,
        code: data.code,
        name: data.name,
        note: data.note,
        isActive: data.isActive ?? true,
      },
    });
  }

  public async findById(nodeId: string): Promise<ServiceNode | null> {
    return prisma.serviceNode.findUnique({ where: { nodeId } });
  }

  public async findAll(
    nodeType?: NodeType,
    onlyActive: boolean = true,
    page: number = 1,
    size: number = 10
  ): Promise<{ nodes: ServiceNode[]; totalItems: number }> {
    const safePage = Math.max(page, 1);
    const safeSize = Math.max(size, 1);
    const skip = (safePage - 1) * safeSize;

    const where = {
      nodeType: nodeType ?? undefined,
      isActive: onlyActive ? true : undefined,
    };

    const [nodes, totalItems] = await Promise.all([
      prisma.serviceNode.findMany({
        where,
        skip,
        take: safeSize,
        orderBy: { code: "asc" },
      }),
      prisma.serviceNode.count({ where }),
    ]);

    return { nodes, totalItems };
  }

  public async findByParentId(parentId: string): Promise<ServiceNode[]> {
    return prisma.serviceNode.findMany({
      where: { parentId, isActive: true },
    });
  }

  public async update(
    nodeId: string,
    data: UpdateServiceNodeRequestDto
  ): Promise<ServiceNode> {
    const parentId =
      data.parentId === undefined ? undefined : data.parentId || null;

    return prisma.serviceNode.update({
      where: { nodeId },
      data: {
        nodeType: data.nodeType,
        parentId,
        code: data.code,
        name: data.name,
        note: data.note,
        isActive: data.isActive,
      },
    });
  }

  public async softDelete(nodeId: string): Promise<ServiceNode> {
    return prisma.serviceNode.update({
      where: { nodeId },
      data: { isActive: false },
    });
  }

  public async delete(nodeId: string): Promise<ServiceNode> {
    return prisma.serviceNode.delete({ where: { nodeId } });
  }

  public async existsByCode(
    code: string,
    excludeNodeId?: string
  ): Promise<boolean> {
    const count = await prisma.serviceNode.count({
      where: {
        code,
        nodeId: excludeNodeId ? { not: excludeNodeId } : undefined,
      },
    });
    return count > 0;
  }
}
