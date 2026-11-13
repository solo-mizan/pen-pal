"use client";
import { motion } from "framer-motion";
import { Clock3 } from "lucide-react";
export default function ArrivalBadge(){return <motion.div className="arrival-note" animate={{y:[0,-4,0]}} transition={{duration:5,repeat:Infinity,ease:"easeInOut"}}><Clock3 size={14}/><span><b>On its way</b><small>A little anticipation never hurt</small></span></motion.div>}
