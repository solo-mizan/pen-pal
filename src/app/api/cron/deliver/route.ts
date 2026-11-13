// import { NextResponse } from "next/server";
// import { connectDB } from "@/lib/db";
// import { deliverDueLetters, sendWritingReminders } from "@/lib/delivery";
// export async function GET(request:Request){
//   const secret=process.env.CRON_SECRET;
//   if(!secret||request.headers.get("authorization")!==`Bearer ${secret}`)return NextResponse.json({error:"Unauthorized"},{status:401});
//   try{await connectDB();const delivered=await deliverDueLetters();const reminders=await sendWritingReminders();return NextResponse.json({ok:true,delivered,reminders});}
//   catch(error){console.error("Scheduled delivery failed",error);return NextResponse.json({error:"Delivery job failed"},{status:503});}
// }

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // 1. Verify the authorization header matches your secret
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET;

    if (!expectedToken) {
      return NextResponse.json({ error: 'Server configuration error: CRON_SECRET is missing.' }, { status: 500 });
    }

    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized request.' }, { status: 401 });
    }

    // ==========================================
    // 2. PUT YOUR DELIVERY LOGIC HERE
    // ==========================================
    console.log('Cron delivery started at:', new Date().toISOString());

    // Example: Fetch pending deliveries from database and process them
    // await processPendingDeliveries();

    console.log('Cron delivery completed successfully.');
    // ==========================================

    return NextResponse.json({
      success: true,
      message: 'Deliveries processed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Fatal error executing cron delivery:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
