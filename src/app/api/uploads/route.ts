import { NextResponse } from "next/server";
import { isAzureConfigured, uploadUserImage } from "@/lib/server/azure-blob";
import { requireUser } from "@/lib/server/require-user";

export const runtime = "nodejs";

const MAX_FILES = 6;
const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    if (!isAzureConfigured()) {
      return NextResponse.json(
        { error: "Azure Blob Storage is not configured yet." },
        { status: 500 },
      );
    }

    const user = await requireUser(request);
    const form = await request.formData();
    const files = form
      .getAll("files")
      .concat(form.getAll("file"))
      .filter((item): item is File => typeof File !== "undefined" && item instanceof File && item.size > 0);

    if (!files.length) {
      return NextResponse.json({ error: "Choose at least one photo." }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: "You can upload up to 6 photos." }, { status: 400 });
    }

    const urls: string[] = [];
    for (const file of files) {
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ error: `${file.name} is larger than 8MB.` }, { status: 400 });
      }
      const type = file.type || "";
      const nameOk = /\.(jpe?g|png|webp|gif|heic|heif|bmp|avif)$/i.test(file.name);
      if (type && !type.startsWith("image/") && !nameOk) {
        return NextResponse.json({ error: `${file.name} is not an image.` }, { status: 400 });
      }
      if (!type && !nameOk) {
        return NextResponse.json({ error: `${file.name} is not an image.` }, { status: 400 });
      }
      try {
        const bytes = Buffer.from(await file.arrayBuffer());
        urls.push(await uploadUserImage(user.uid, bytes));
      } catch (error) {
        const detail = error instanceof Error ? error.message : "processing failed";
        return NextResponse.json(
          {
            error: `Could not process ${file.name}. Try a JPG or PNG. (${detail})`,
          },
          { status: 400 },
        );
      }
    }

    return NextResponse.json({ urls });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    const status = message === "Not signed in" || message === "Invalid session" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
