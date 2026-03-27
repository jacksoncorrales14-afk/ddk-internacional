import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { identificacion } = await req.json();

    if (!identificacion) {
      return NextResponse.json({ error: "Numero de identificacion requerido" }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({ where: { identificacion } });
    if (!admin) {
      return NextResponse.json({ message: "Si la identificacion existe, se enviara la nueva contraseña" });
    }

    // Generar contraseña temporal
    const nuevaPassword = "DDK" + Math.random().toString(36).slice(-6).toUpperCase();
    const hashedPassword = await bcrypt.hash(nuevaPassword, 12);

    // Actualizar en BD
    await prisma.admin.update({
      where: { identificacion },
      data: { password: hashedPassword },
    });

    // Enviar correo
    const port = parseInt(process.env.SMTP_PORT || "465");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "seguridadddk.com",
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: `"DDK Internacional" <${process.env.SMTP_USER}>`,
      to: "camaras@seguridadddk.com",
      subject: "Recuperacion de Contraseña - DDK Internacional",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1e3a5f;">DDK Internacional</h2>
          <p>Se ha solicitado una recuperacion de contraseña para la cuenta:</p>
          <p><strong>Identificacion:</strong> ${identificacion}</p>
          <p><strong>Nueva contraseña temporal:</strong></p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px;">
            ${nuevaPassword}
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            Por seguridad, cambie esta contraseña lo antes posible.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ message: "Si la identificacion existe, se enviara la nueva contraseña" });
  } catch (error) {
    console.error("Error en recuperacion:", error);
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 });
  }
}
