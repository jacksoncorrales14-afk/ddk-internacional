import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { recuperarPasswordSchema, escaparHtml } from "@/lib/validations";
import { passwordRecoveryLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

// Respuesta generica para no filtrar si la identificacion existe o no
const RESPUESTA_GENERICA = {
  message: "Si la identificacion existe, se enviara la nueva contraseña al correo asociado",
};

export async function POST(req: NextRequest) {
  // Rate-limit estricto: 5 intentos por hora por IP
  const ip = getClientIp(req);
  const { success } = passwordRecoveryLimiter.check(5, ip);
  if (!success) return rateLimitResponse();

  try {
    const body = await req.json().catch(() => ({}));
    const validated = recuperarPasswordSchema.safeParse(body);
    if (!validated.success) {
      // Devolvemos respuesta generica aunque el input este mal, para no filtrar
      return NextResponse.json(RESPUESTA_GENERICA);
    }

    const { identificacion } = validated.data;

    const admin = await prisma.admin.findUnique({ where: { identificacion } });
    if (!admin) {
      return NextResponse.json(RESPUESTA_GENERICA);
    }

    // Generar contraseña temporal
    const nuevaPassword = "DDK" + Math.random().toString(36).slice(-6).toUpperCase();
    const hashedPassword = await bcrypt.hash(nuevaPassword, 12);

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

    // Escapar valores interpolados en HTML para prevenir inyeccion
    const identificacionSegura = escaparHtml(identificacion);
    const passwordSegura = escaparHtml(nuevaPassword);

    await transporter.sendMail({
      from: `"DDK Internacional" <${process.env.SMTP_USER}>`,
      to: "camaras@seguridadddk.com",
      subject: "Recuperacion de Contraseña - DDK Internacional",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1e3a5f;">DDK Internacional</h2>
          <p>Se ha solicitado una recuperacion de contraseña para la cuenta:</p>
          <p><strong>Identificacion:</strong> ${identificacionSegura}</p>
          <p><strong>Nueva contraseña temporal:</strong></p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px;">
            ${passwordSegura}
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            Por seguridad, cambie esta contraseña lo antes posible.
          </p>
        </div>
      `,
    });

    return NextResponse.json(RESPUESTA_GENERICA);
  } catch (error) {
    console.error("Error en recuperacion:", error);
    // No revelar detalles del error
    return NextResponse.json(RESPUESTA_GENERICA);
  }
}
