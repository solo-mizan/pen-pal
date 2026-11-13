import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import { connectDB } from "@/lib/db";
import { consumeRateLimit } from "@/lib/rate-limit";
import { clerkConfigured } from "@/lib/config";
export async function POST(){
  if (!clerkConfigured) return NextResponse.json({ok:false,error:"Authentication is not configured."},{status:503});
  const {userId}=await auth(); if(!userId)return NextResponse.json({ok:false,error:"Sign in to attach photographs."},{status:401});
  try { await connectDB(); if (!await consumeRateLimit(userId,"photo-upload",30,60*60*1000)) return NextResponse.json({ok:false,error:"Please wait before uploading more photographs."},{status:429}); }
  catch { return NextResponse.json({ok:false,error:"Uploads are temporarily unavailable."},{status:503}); }
  const cloudName=process.env.CLOUDINARY_CLOUD_NAME,apiKey=process.env.CLOUDINARY_API_KEY,apiSecret=process.env.CLOUDINARY_API_SECRET;
  if(!cloudName||!apiKey||!apiSecret)return NextResponse.json({ok:false,error:"Photo uploads are not configured yet."},{status:503});
  cloudinary.config({cloud_name:cloudName,api_key:apiKey,api_secret:apiSecret});
  const timestamp=Math.floor(Date.now()/1000),publicId=randomUUID(),folder="dear-letter/private",context=`ownerId=${userId}`;
  const allowed_formats="jpg,png,webp",max_file_size=10_485_760;
  const params={allowed_formats,context,folder,max_file_size,public_id:publicId,timestamp,type:"authenticated"};
  return NextResponse.json({ok:true,cloudName,apiKey,timestamp,publicId,folder,context,allowed_formats,max_file_size,signature:cloudinary.utils.api_sign_request(params,apiSecret)});
}
