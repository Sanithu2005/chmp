"use server";

import { s3Client, bucket } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { patients } from "@/db/schema";
import { eq } from "drizzle-orm";

function validateImage(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File size must be less than 5MB");
  }
}

async function uploadToS3(file: File, key: string) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );
  } catch (err) {
    if (err instanceof Error && err.name === "AggregateError") {
      throw new Error("Unable to connect to file storage. Please try again later.");
    }
    throw err;
  }

  return `${process.env.NEXT_PUBLIC_S3_URL}/${key}`;
}

export async function uploadProfileImage(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  validateImage(file);

  const key = `profiles/${session.user.id}/${Date.now()}-${file.name}`;
  const publicUrl = await uploadToS3(file, key);
  return { url: publicUrl, key };
}

export async function uploadPatientImage(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const file = formData.get("file") as File;
  const patientId = formData.get("patientId") as string;
  if (!file || !patientId) throw new Error("Missing file or patientId");

  validateImage(file);

  const key = `patients/${patientId}/${Date.now()}-${file.name}`;
  const publicUrl = await uploadToS3(file, key);

  await db
    .update(patients)
    .set({ image: publicUrl })
    .where(eq(patients.id, patientId));

  return { url: publicUrl, key };
}
