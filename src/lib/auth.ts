import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import prisma from './prisma';
import type { UserRole } from '@/types';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      image?: string | null;
    };
  }
  interface User {
    role: UserRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email a heslo jsou povinné');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error('Neplatné přihlašovací údaje');
        }

        const isValid = await compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Neplatné přihlašovací údaje');
        }

        // Log the login
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'login',
            entity: 'user',
            entityId: user.id,
          },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as UserRole,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
};

export function hasPermission(role: UserRole, permission: string): boolean {
  const { ROLE_PERMISSIONS } = require('@/types');
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  if (perms.includes('*')) return true;
  return perms.includes(permission);
}
