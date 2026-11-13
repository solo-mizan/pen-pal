import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { deliverDueLetters, sendWritingReminders } from "@/lib/delivery";
export async function GET(request:Request){
  const secret=process.env.CRON_SECRET;
  if(!secret||request.headers.get("authorization")!==`Bearer ${secret}`)return NextResponse.json({error:"Unauthorized"},{status:401});
  try{await connectDB();const delivered=await deliverDueLetters();const reminders=await sendWritingReminders();return NextResponse.json({ok:true,delivered,reminders});}
  catch(error){console.error("Scheduled delivery failed",error);return NextResponse.json({error:"Delivery job failed"},{status:503});}
}
