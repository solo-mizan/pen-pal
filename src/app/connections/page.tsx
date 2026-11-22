import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import { Connection, User } from "@/models";
import ConnectionsClient from "@/components/connections-client";
import SiteHeader from "@/components/site-header";
import { clerkConfigured } from "@/lib/config";
export const dynamic="force-dynamic";
export default async function ConnectionsPage(){if(!clerkConfigured)redirect("/sign-in");const {userId}=await auth();if(!userId)redirect("/sign-in");await connectDB();const [connections,incoming]=await Promise.all([Connection.find({participants:userId,status:"accepted"}).lean(),Connection.find({recipientId:userId,status:"pending"}).lean()]);const ids=[...connections.flatMap(c=>c.participants.filter((id:string)=>id!==userId)),...incoming.map(c=>c.requesterId)];const users=await User.find({clerkId:{$in:ids}}).select("clerkId displayName username").lean();const byId=new Map(users.map(u=>[u.clerkId,{id:u.clerkId,name:u.displayName,username:u.username}]));return <><SiteHeader/><main className="connections-page"><ConnectionsClient connections={connections.map(c=>({id:String(c._id),person:byId.get(c.participants.find((id:string)=>id!==userId)!)!})).filter(c=>c.person)} incoming={incoming.map(c=>({id:String(c._id),person:byId.get(c.requesterId)!})).filter(c=>c.person)}/></main></>}
