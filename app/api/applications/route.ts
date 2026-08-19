import {NextResponse} from "next/server";
export async function POST(req:Request){const body=await req.json(); if(!body.name||!body.email||!body.startup) return NextResponse.json({ok:false,error:"Eksik alan"},{status:400}); console.log("Lidea MVP application",body); return NextResponse.json({ok:true,message:"Başvuru alındı"});}
