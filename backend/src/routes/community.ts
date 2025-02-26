import { corsHeaders } from "../utils/cors";
import { verifyToken } from "./auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const backendURL = "http://localhost:3000"; // Замените на нужный URL

export async function createCommunity(req: Request): Promise<Response> {
  try {
    const tokenData = await verifyToken(req);
    const tokenUserId = tokenData?.user?.id || tokenData?.id;
    if (!tokenUserId) {
      return new Response(
        JSON.stringify({ error: "Не авторизован" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders() } }
      );
    }

    // Объявляем переменные для данных
    let name: string | null = null;
    let description: string | null = null;
    let categoryId: string | null = null;
    let rules: string | null = null;
    let avatar: string | null = null;
    let background: string | null = null;

    let avatarFile: File | null = null;
    let backgroundFile: File | null = null;

    const contentType = req.headers.get("Content-Type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      name = formData.get("name") as string | null;
      description = formData.get("description") as string | null;
      categoryId = formData.get("categoryId") as string | null;
      rules = formData.get("rules") as string | null;
      avatarFile = formData.get("avatar") as File | null;
      backgroundFile = formData.get("background") as File | null;
    } else {
      const body = await req.json();
      name = body.name;
      description = body.description;
      categoryId = body.categoryId;
      rules = body.rules;
      // Если данные приходят в JSON, ожидаем уже готовые URL
      avatar = body.avatar;
      background = body.background;
    }

    if (!name || name.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: "Название сообщества обязательно и должно содержать минимум 3 символа" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders() } }
      );
    }
    if (!description || description.trim().length < 20) {
      return new Response(
        JSON.stringify({ error: "Описание сообщества обязательно и должно содержать минимум 20 символов" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders() } }
      );
    }

    // Если переданы файлы, сохраняем их
    if (avatarFile && avatarFile instanceof File) {
      const fileExtension = avatarFile.name.split(".").pop();
      const fileName = `community_avatar_${Date.now()}.${fileExtension}`;
      const filePath = `/uploads/${fileName}`;
      await Bun.write(`./public${filePath}`, avatarFile);
      avatar = `${backendURL}${filePath}`;
    }
    if (backgroundFile && backgroundFile instanceof File) {
      const fileExtension = backgroundFile.name.split(".").pop();
      const fileName = `community_background_${Date.now()}.${fileExtension}`;
      const filePath = `/uploads/${fileName}`;
      await Bun.write(`./public${filePath}`, backgroundFile);
      background = `${backendURL}${filePath}`;
    }

    // Создаем сообщество с вложенной записью CommunityMember для владельца
    const community = await prisma.community.create({
      data: {
        name,
        description,
        avatar,      // URL аватарки (сохраненного файла или переданный в JSON)
        background,  // URL фонового изображения
        rules,
        owner: {
          connect: { id: tokenUserId },
        },
        ...(categoryId && { category: { connect: { id: categoryId } } }),
        members: {
          create: {
            user: { connect: { id: tokenUserId } },
            role: "ADMIN",
          },
        },
      },
      include: {
        owner: true,
        category: true,
        members: true,
      },
    });

    return new Response(JSON.stringify(community), {
      status: 201,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  } catch (error: unknown) {
    console.error("Ошибка в createCommunity:", error);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }
}

export async function getCommunity(req: Request): Promise<Response> {
  try {
    // Извлекаем параметры из URL, например: /api/community?id=...&userId=...
    const url = new URL(req.url);
    const communityId = url.searchParams.get("id");
    const userId = url.searchParams.get("userId");

    if (!communityId) {
      return new Response(
        JSON.stringify({ error: "Не указан идентификатор сообщества" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders() } }
      );
    }

    const community = await prisma.community.findUnique({
      where: { id: communityId },
      include: {
        owner: true,
        category: true,
        members: {
          include: {
            user: true,
          },
        },
        posts: {
          include: {
            author: true,
          },
        },
      },
    });

    if (!community) {
      return new Response(
        JSON.stringify({ error: "Сообщество не найдено" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders() } }
      );
    }

    if (userId) {
      const member = community.members.find((m: any) => m.user.id === userId);
      (community as any).isFollow = !!member;
      (community as any).notificationEnabled = member ? member.notifications : false;
    }

    return new Response(JSON.stringify(community), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  } catch (error) {
    console.error("Ошибка получения сообщества:", error);
    return new Response(
      JSON.stringify({ error: "Ошибка сервера" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders() } }
    );
  }
}

export async function toggleCommunitySubscription(req: Request): Promise<Response> {
  try {
    const tokenData = await verifyToken(req);
    const tokenUserId = tokenData?.user?.id || tokenData?.id;
    if (!tokenUserId) {
      return new Response(
        JSON.stringify({ error: "Не авторизован" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders() } }
      );
    }

    const { communityId } = await req.json();
    if (!communityId) {
      return new Response(
        JSON.stringify({ error: "Не указан идентификатор сообщества" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders() } }
      );
    }

    const existingMember = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId: tokenUserId,
        },
      },
    });

    if (existingMember) {
      await prisma.communityMember.delete({
        where: {
          communityId_userId: {
            communityId,
            userId: tokenUserId,
          },
        },
      });
      return new Response(
        JSON.stringify({ message: "Отписка успешна" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders() } }
      );
    } else {
      await prisma.communityMember.create({
        data: {
          communityId,
          userId: tokenUserId,
          role: "MEMBER", 
        },
      });
      return new Response(
        JSON.stringify({ message: "Подписка успешна" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders() } }
      );
    }
  } catch (error: any) {
    console.error("Ошибка в toggleCommunitySubscription:", error);
    return new Response(
      JSON.stringify({ error: "Server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders() } }
    );
  }
}

export async function toggleCommunityNotifications(req: Request): Promise<Response> {
  try {
    const tokenData = await verifyToken(req);
    const tokenUserId = tokenData?.user?.id || tokenData?.id;
    if (!tokenUserId) {
      return new Response(
        JSON.stringify({ error: "Не авторизован" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders() } }
      );
    }

    const { communityId } = await req.json();
    if (!communityId) {
      return new Response(
        JSON.stringify({ error: "Не указан идентификатор сообщества" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders() } }
      );
    }

    const member = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId: tokenUserId,
        },
      },
    });

    if (!member) {
      return new Response(
        JSON.stringify({ error: "Вы не являетесь участником сообщества" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders() } }
      );
    }

    const newNotifications = !member.notifications;

    const updatedMember = await prisma.communityMember.update({
      where: {
        communityId_userId: {
          communityId,
          userId: tokenUserId,
        },
      },
      data: {
        notifications: newNotifications,
      },
    });

    return new Response(
      JSON.stringify({ notificationEnabled: updatedMember.notifications }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders() } }
    );
  } catch (error: any) {
    console.error("Ошибка переключения уведомлений:", error);
    return new Response(JSON.stringify({ error: "Ошибка сервера" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }
}