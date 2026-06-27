import { ImageResponse } from "next/og";
import { brandFace } from "@/lib/brandIcon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(brandFace(180), { ...size });
}
