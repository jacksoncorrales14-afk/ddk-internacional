import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "admin-login",
      name: "Admin",
      credentials: {
        identificacion: { label: "Identificacion", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identificacion || !credentials?.password) return null;

        const admin = await prisma.admin.findUnique({
          where: { identificacion: credentials.identificacion },
        });

        if (!admin) return null;

        const valid = await bcrypt.compare(credentials.password, admin.password);
        if (!valid) return null;

        return {
          id: admin.id,
          email: admin.identificacion,
          name: admin.name,
          role: "admin",
        };
      },
    }),
    CredentialsProvider({
      id: "trabajador-login",
      name: "Trabajador",
      credentials: {
        cedula: { label: "Cedula", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.cedula || !credentials?.password) return null;

        const trabajador = await prisma.trabajador.findUnique({
          where: { cedula: credentials.cedula },
        });

        if (!trabajador || !trabajador.activo) return null;

        const valid = await bcrypt.compare(credentials.password, trabajador.password);
        if (!valid) return null;

        return {
          id: trabajador.id,
          email: trabajador.email,
          name: trabajador.nombre,
          role: "trabajador",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
