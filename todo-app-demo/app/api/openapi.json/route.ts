import fs from "node:fs";
import path from "node:path";
import { load } from "js-yaml";
import { NextResponse } from "next/server";

const SPEC_PATH = path.join(process.cwd(), "openapi.yaml");

export function GET() {
  const raw = fs.readFileSync(SPEC_PATH, "utf-8");
  const spec = load(raw);
  return NextResponse.json(spec);
}
