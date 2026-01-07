import { NodeType, Prisma } from "@prisma/client";
import { prisma } from "../config/database.config";
import { CreateServiceNodeRequestDto } from "../modules/service-node/dtos/service-node.request.dto";

type ServiceItemSeed = {
  itemCode: string;
  name: string;
};

type ServiceTypeSeed = {
  code: string;
  name: string;
  items: ServiceItemSeed[];
};

const makeItems = (typeCode: string, names: string[]): ServiceItemSeed[] =>
  names.map((name, index) => ({
    itemCode: `${typeCode}-${String(index + 1).padStart(2, "0")}`,
    name,
  }));

const CDHA_TYPES: ServiceTypeSeed[] = [
  {
    code: "CDHA-MRI",
    name: "Chụp MRI",
    items: makeItems("CDHA-MRI", [
      "Tiêm tương phản",
      "Không tiêm tương phản",
      "Sọ não",
      "Cột sống cổ",
      "Cột sống ngực",
      "Cột sống thắt lưng",
      "Chậu (tiểu khung)",
      "Lồng ngực",
      "Vú",
      "Bụng",
      "Khớp vai trái",
      "Khớp vai phải",
      "Khớp gối trái",
      "Khớp gối phải",
      "Khớp cổ chân trái",
      "Khớp cổ chân phải",
      "MRA",
    ]),
  },
  {
    code: "CDHA-CT",
    name: "CT-Scan",
    items: makeItems("CDHA-CT", [
      "Không tiêm cản quang",
      "Có tiêm cản quang",
      "Sọ não",
      "Mạch vành",
      "Ngực - Phổi",
      "Bụng - Chậu",
      "CTA",
      "Tái tạo mạch máu",
      "Tái tạo 3D sọ não",
      "Cửa sổ xương",
    ]),
  },
  {
    code: "CDHA-SIEU-AM",
    name: "Siêu âm",
    items: makeItems("CDHA-SIEU-AM", [
      "Bụng",
      "Giáp",
      "Tim",
      "Mạch máu",
      "Mô mềm",
      "Hạch",
      "Khớp",
      "Vú",
      "Sản phụ khoa",
      "Đàn hồi mô gan",
      "Bìu",
    ]),
  },
  {
    code: "CDHA-XQUANG",
    name: "X-Quang",
    items: makeItems("CDHA-XQUANG", ["X-quang"]),
  },
  {
    code: "CDHA-MAT-DO-XUONG",
    name: "Mật độ xương",
    items: makeItems("CDHA-MAT-DO-XUONG", [
      "Cột sống thắt lưng",
      "Đầu dưới 2 xương cẳng tay",
      "Cổ xương đùi",
      "Toàn thân",
    ]),
  },
  {
    code: "CDHA-DIEN-CO",
    name: "Điện cơ",
    items: makeItems("CDHA-DIEN-CO", [
      "Hai chi trên",
      "Hai chi dưới",
      "Tứ chi",
      "Nhược cơ mắt",
    ]),
  },
  {
    code: "CDHA-DIEN-TIM",
    name: "Điện tim",
    items: makeItems("CDHA-DIEN-TIM", ["Thường", "Holter 24h"]),
  },
  {
    code: "CDHA-NOI-SOI-TH",
    name: "Nội soi tiêu hóa",
    items: makeItems("CDHA-NOI-SOI-TH", [
      "Dạ dày",
      "Trực tràng",
      "Đại tràng",
      "Đại trực tràng",
    ]),
  },
];

const XN_TYPES: ServiceTypeSeed[] = [
  {
    code: "XN-HUYET-HOC",
    name: "Huyết học",
    items: makeItems("XN-HUYET-HOC", [
      "Tổng phân tích tế bào máu",
      "Tốc độ lắng (VS)",
      "Nhóm máu ABO-Rh",
      "Sốt rét",
      "Hồng cầu lưới",
      "Nghiệm pháp Coombs TT-GT",
      "L.E. cells",
      "Kháng thể kháng nhân (ANA Test)",
      "Anti - ds DNA",
    ]),
  },
  {
    code: "XN-VIEM-GAN",
    name: "Viêm gan",
    items: makeItems("XN-VIEM-GAN", [
      "HBsAg",
      "Anti-HBs",
      "HBeAg",
      "Anti-HBe",
      "Anti-HBc IgM",
      "Anti-HBc total",
      "Anti-HCV",
      "Anti-HAV-IgM",
      "Anti-HAV total",
    ]),
  },
  {
    code: "XN-DONG-MAU",
    name: "Đông máu",
    items: makeItems("XN-DONG-MAU", [
      "Thời gian máu chảy (TS)",
      "PT (TP, TQ)",
      "APTT (TCK, TCA)",
      "Fibrinogen",
      "D-Dimer",
    ]),
  },
  {
    code: "XN-HOA-SINH",
    name: "Hóa sinh",
    items: makeItems("XN-HOA-SINH", [
      "Glucose lúc đói",
      "Glucose sau ăn 2 giờ",
      "Nghiệm pháp dung nạp đường",
      "HbA1c",
      "Ure",
      "Creatinin",
      "Độ lọc cầu thận (eGFR)",
      "Acid Uric",
      "Cholesterol",
      "Triglyceride",
      "HDL-C",
      "LDL-C",
      "VLDL-C",
      "AST (GOT)",
      "ALT (GPT)",
      "Bilirubin TP-TT-GT",
      "GGT",
      "ALP",
      "Protit TP",
      "Albumin",
      "A/G",
      "Amylase",
      "LDH",
      "Điện giải đồ (Na+, K+, Cl-)",
      "Ca toàn phần",
      "Ca++ (ion hóa)",
      "Mg",
      "Phospho",
      "Sắt huyết thanh (Fe)",
      "Ferritin",
      "Transferrin",
      "CRP",
      "ASO",
      "RF",
      "CPK",
      "Vitamin D",
    ]),
  },
  {
    code: "XN-TUYEN-GIAP",
    name: "Tuyến giáp",
    items: makeItems("XN-TUYEN-GIAP", [
      "T3",
      "T4",
      "FT3",
      "FT4",
      "TSH",
      "TRAb (TSH Receptor AB)",
      "Anti-Tg",
      "Anti-TPO",
    ]),
  },
  {
    code: "XN-DAU-AN-UNG-THU",
    name: "Dấu ấn ung thư",
    items: makeItems("XN-DAU-AN-UNG-THU", [
      "AFP",
      "CEA",
      "CA 15.3",
      "CA 125",
      "CA 19-9",
      "CA 72.4",
      "Cyfra 21.1",
      "Total PSA",
      "Free PSA",
      "SCC",
      "Pepsinogen 1-2",
    ]),
  },
  {
    code: "XN-NUOC-TIEU",
    name: "Nước tiểu",
    items: makeItems("XN-NUOC-TIEU", [
      "TPT nước tiểu",
      "Amylase",
      "Ion đồ",
      "Microalbumin",
      "Creatinin",
      "Cặn Addis",
      "Cấy + KSD",
    ]),
  },
  {
    code: "XN-MIEN-DICH",
    name: "Miễn dịch",
    items: makeItems("XN-MIEN-DICH", [
      "Quantiferon",
      "HP test máu",
      "HP hơi thở",
    ]),
  },
  {
    code: "XN-PHAN",
    name: "Phân",
    items: makeItems("XN-PHAN", ["Soi tươi", "FOB (Máu ẩn trong phân)", "HP/Ag", "Cấy + KSD"]),
  },
  {
    code: "XN-SHPT",
    name: "Sinh học phân tử",
    items: makeItems("XN-SHPT", [
      "HBV DNA (Định tính)",
      "HBV DNA Realtime (Định lượng)",
      "HBV DNA TaqMan (Định lượng)",
      "HBV DNA Roche (Định lượng)",
      "HBV Genotype (Sequencing)",
      "HCV RNA (Định tính)",
      "HCV RNA Realtime (Định lượng)",
      "HCV RNA TaqMan (Định lượng)",
      "HCV RNA Roche (Định lượng)",
      "HCV Genotype (Sequencing)",
      "PCR Lao",
      "HPV DNA (Định tính)",
      "HPV Genotype",
      "HPV Cobas Roche",
      "CMV DNA Roche",
      "HLA-B27",
    ]),
  },
  {
    code: "XN-TIM-MACH",
    name: "Tim mạch",
    items: makeItems("XN-TIM-MACH", [
      "CK-MB",
      "Troponin T-hs",
      "BNP",
      "NT-Pro BNP",
      "Homocystein",
      "Digoxin",
      "hs CRP",
    ]),
  },
  {
    code: "XN-NOI-TIET",
    name: "Nội tiết tố",
    items: makeItems("XN-NOI-TIET", [
      "Beta-HCG",
      "Estradiol",
      "Progesterone",
      "Prolactin",
      "AMH",
      "Testosterone",
      "LH",
      "FSH",
      "Cortisol",
      "Aldosterone",
      "Adrenalin",
      "ACTH",
      "hGH",
      "IGF-1",
      "ADH",
      "Free metanephrine",
      "DHEA SO4",
      "Test bộ 3 Catecholamines",
    ]),
  },
  {
    code: "XN-DIEN-DI",
    name: "Điện di",
    items: makeItems("XN-DIEN-DI", [
      "Điện di hemoglobin (HbA, HbF, HbA2, HbE, ...)",
      "Điện di Protein/Huyết thanh",
      "Điện di Protein/Nước tiểu",
    ]),
  },
  {
    code: "XN-XN-KHAC",
    name: "Xét nghiệm khác",
    items: makeItems("XN-XN-KHAC", [
      "Insulin",
      "C-peptide",
      "Ceton/máu",
      "Anti-CCP",
      "Folate",
      "B12",
      "HSV 1,2 IgM",
      "HSV 1,2 IgG",
      "CMV IgG",
      "CMV IgM",
      "HLA-B27",
      "HIV",
      "Syphilis",
      "Dengue NS1",
      "Dengue IgM-IgG",
      "Double test",
      "HP test",
    ]),
  },
  {
    code: "XN-KY-SINH-TRUNG",
    name: "Chẩn đoán ký sinh trùng",
    items: makeItems("XN-KY-SINH-TRUNG", [
      "Giun đũa chó/ Toxocara canis IgG",
      "Giun lươn/ Strongyloides TgG",
      "Sán dây chó/ Echinococcus TgM",
      "Sán dải heo/ Cysticercose IgG",
      "Sán lá lớn gan/ Fasciola hepatica IgG",
      "Sán lá nhỏ gan/ Clonorchis sinensis IgM",
      "Sán lá nhỏ gan/ Clonorchis sinensis IgG",
      "Sán đầu gai/ Gnathostoma IgG",
      "Sán lá phổi/ Paragonimus IgM",
      "Amib (Entamoeba histolytica)",
      "Giun xoắn/ Trichinella IgM",
      "Giun xoắn/ Trichinella IgG",
    ]),
  },
];

const upsertServiceNode = async (data: CreateServiceNodeRequestDto) =>
  prisma.serviceNode.upsert({
    where: { code: data.code ?? "" },
    update: {
      name: data.name,
      nodeType: data.nodeType,
      parentId: data.parentId ?? null,
      isActive: data.isActive ?? true,
      note: data.note ?? null,
    },
    create: data,
  });

export const seedServiceItems = async () => {
  const categoryXn = await upsertServiceNode({
    code: "xn",
    name: "Xét nghiệm",
    nodeType: NodeType.CATEGORY,
    isActive: true,
  });

  const categoryCdha = await upsertServiceNode({
    code: "cdha",
    name: "Chẩn đoán hình ảnh",
    nodeType: NodeType.CATEGORY,
    isActive: true,
  });

  const seedTypeGroup = async (
    categoryId: string,
    types: ServiceTypeSeed[]
  ) => {
    for (const type of types) {
      const typeNode = await upsertServiceNode({
        code: type.code,
        name: type.name,
        nodeType: NodeType.TYPE,
        parentId: categoryId,
        isActive: true,
      });

      for (const item of type.items) {
        await prisma.serviceItem.upsert({
          where: { itemCode: item.itemCode },
          update: {
            name: item.name,
            categoryId,
            typeId: typeNode.nodeId,
            isActive: true,
          },
          create: {
            itemCode: item.itemCode,
            name: item.name,
            categoryId,
            typeId: typeNode.nodeId,
            isActive: true,
          },
        });
      }
    }
  };

  await seedTypeGroup(categoryCdha.nodeId, CDHA_TYPES);
  await seedTypeGroup(categoryXn.nodeId, XN_TYPES);
};
