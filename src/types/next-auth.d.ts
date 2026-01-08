import type { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      email?: string | null;
      name?: string | null;
      username?: string;
      avatar?: string;
      accessToken?: string;
    };
  }

  interface User extends DefaultUser {
    id: string;
    username?: string;
    avatar?: string;
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    avatar?: string;
    accessToken?: string;
  }
}
