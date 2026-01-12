import { Request, Response, NextFunction } from 'express';
import { prisma } from "../config/database.config"; // Sửa lại đường dẫn import prisma của bạn cho đúng
import { FileService } from "../modules/file/services/file.service";

const fileService = new FileService();

// Định nghĩa lại Request để TypeScript hiểu các biến custom bạn gắn vào
interface CustomRequest extends Request {
    payload?: {
        userId: string;
        username?: string;
        fullName?: string;
        role?: string;
    };
    files?: Express.Multer.File[]; // Kiểu dữ liệu file của Multer
    requestAt?: Date; // Thời gian bắt đầu request
}

export const auditLogsMiddleware = (action: string, entityName: string) => {
    return async (req: CustomRequest, res: Response, next: NextFunction) => {
        // Gán thời gian bắt đầu nếu chưa có
        req.requestAt = new Date();
        
        const userId = req.payload?.userId || null;
        const username = req.payload?.username || null;

        // Lưu giữ hàm send gốc
        const originalSend = res.send;

        // Override hàm send để bắt lấy response body
        res.send = function (body: any): Response {
            res.locals.responseBody = body;
            return originalSend.call(this, body);
        };

        // Lắng nghe sự kiện khi response gửi xong
        res.on("finish", async () => {
            const responseBody = res.locals.responseBody;

            // --- 1. XỬ LÝ XÓA FILE RÁC (Nếu request thất bại) ---
            try {
                let parsedBody: any = {};
                
                // Parse body an toàn
                if (typeof responseBody === 'string') {
                    try { parsedBody = JSON.parse(responseBody); } catch {}
                } else if (typeof responseBody === 'object') {
                    parsedBody = responseBody;
                }

                // Nếu success === false, xóa các file đã upload trong request này
                if (parsedBody?.success === false && req.files && req.files.length > 0) {
                    for (const f of req.files) {
                        if (f.path) {
                            // Gọi hàm mới thêm ở FileService
                            await fileService.deleteFileByAbsolutePath(f.path);
                        }
                    }
                }
            } catch (err) {
                console.error('Error cleaning uploaded files:', err);
            }

            // --- 2. GHI AUDIT LOG ---
            // Chỉ ghi log nếu xác định được người thực hiện (userId)
            if (userId) {
                try {
                    const requestAt = req.requestAt || new Date();
                    const now = new Date();
                    const durationMs = now.getTime() - requestAt.getTime();

                    // Map dữ liệu vào Prisma Model audit_logs
                    await prisma.audit_logs.create({
                        data: {
                            performedBy: userId,
                            action: action,
                            tableName: entityName,
                            username: username,
                            fullName: req.payload?.fullName || null,
                            role: req.payload?.role || null,
                            
                            // Lấy IP
                            remoteAddress: req.ip || req.socket.remoteAddress || null,
                            
                            // Thời gian & Hiệu năng
                            requestReceivedAt: requestAt,
                            responseSentAt: now,
                            durationMs: durationMs,
                            
                            // Kết quả trả về
                            responseStatusCode: res.statusCode,
                            
                            // Data (Prisma hỗ trợ lưu Object vào Json field)
                            requestBody: (req.body as any) || {},
                            responseBody: responseBody || {},
                        }
                    });
                } catch (error) {
                    console.error("Lỗi khi ghi audit log:", error);
                }
            }
        });

        next();
    };
};