// pages/api/auth/[...nextauth].ts
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export interface TeamMembership {
  teamId: number;
  teamName: string;
  role: string;
}

export interface TeamMember {
  userId: number;
  username: string;
  email: string;
  role: string;
}

export interface Team {
  id: number;
  name: string;
  inviteCode: string;
  role: string;
  members?: TeamMember[];
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_HOST_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials!.email,
            password: credentials!.password,
          }),
        });

        const result = await response.json();

        if (result.message) {
          console.error("Login error:", result.message);
          return null;
        }

        // Return the minimal info you need
        return {
          id: result.id,           // main user ID
          name: result.name,
          email: result.email,
          settings: result.settings || [],
          token: result.token,     // API token for authorization
          team: result.team || null,
          memberships: result.memberships || [],
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).token || user.id;  // use API token if available, fallback to user ID
        token.settings = (user as any).settings || [];
        token.team = (user as any).team || null;
        token.memberships = (user as any).memberships || [];
      }
      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.settings = Array.isArray(token.settings) ? token.settings : [];
      session.team = token.team as Team | null;
      session.memberships = token.memberships as TeamMembership[];
      return session;
    },
    // redirect to last viewed page after Login
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        const resolvedUrl = `${baseUrl}${url}`;
        return resolvedUrl;
      }

      return "/";
    }


  },
};

// Extend NextAuth session type to include accessToken & settings
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    settings?: Array<any>;
    team?: Team | null;
    memberships?: TeamMembership[];
  }
  interface User {
    settings?: Array<any>;
    team?: Team | null;
    memberships?: TeamMembership[];
  }
}

export default NextAuth(authOptions);
