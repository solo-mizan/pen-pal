import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";
import { connectDB } from "@/lib/db";
import { Letter } from "@/models";
import { canAccessLetterPhotos } from "@/lib/domain";
import { clerkConfigured } from "@/lib/config";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  if (!clerkConfigured) return NextResponse.json({error:"Authentication is not configured"},{status:503});
  const {userId}=await auth(); if(!userId)return NextResponse.json({error:"Unauthorized"},{status:401});
  try{await connectDB();const {id}=await params;const letter=await Letter.findById(id).select("senderId recipientId status photos").lean();if(!letter||!canAccessLetterPhotos(letter,userId))return NextResponse.json({error:"Not found"},{status:404});
    const cloudName=process.env.CLOUDINARY_CLOUD_NAME,apiKey=process.env.CLOUDINARY_API_KEY,apiSecret=process.env.CLOUDINARY_API_SECRET;if(!cloudName||!apiKey||!apiSecret)return NextResponse.json({error:"Photo delivery unavailable"},{status:503});cloudinary.config({cloud_name:cloudName,api_key:apiKey,api_secret:apiSecret});
    const urls=await Promise.all(letter.photos.map(async (photo:{publicId:string;format?:string})=>cloudinary.utils.private_download_url(photo.publicId,photo.format||"jpg",{expires_at:Math.floor(Date.now()/1000)+300,resource_type:"image",type:"authenticated"})));return NextResponse.json({photos:urls},{headers:{"Cache-Control":"private, no-store"}});
  }catch{return NextResponse.json({error:"Could not retrieve photographs"},{status:500});}
}
