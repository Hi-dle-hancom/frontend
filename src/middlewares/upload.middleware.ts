import multer from "multer";
import path from "path";
import fs from "fs";
import config from "../config";

// uploads 디렉토리 생성
try {
  fs.accessSync(config.paths.uploads);
} catch (error) {
  console.error("uploads 폴더가 없어 uploads 폴더를 생성합니다.");
  fs.mkdirSync(config.paths.uploads, { recursive: true });
}

// 파일 업로드 설정
export const uploadMiddleware = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, config.paths.uploads);
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
    },
  }),
  limits: config.upload.limits,
  fileFilter: (req, file, cb) => {
    // 허용할 파일 타입 (이미지만 허용)
    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("허용되지 않는 파일 형식입니다. 이미지만 업로드 가능합니다."),
      );
    }
  },
});
