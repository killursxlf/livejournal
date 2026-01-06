"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Flag,
  CheckCircle,
  XCircle,
  ExternalLink,
  MoreVertical,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const REPORT_REASONS = [
  { id: "spam", label: "Спам" },
  { id: "inappropriate", label: "Неприемлемый контент" },
  { id: "fraud", label: "Мошенничество" },
  { id: "harassment", label: "Оскорбления" },
  { id: "other", label: "Другое" },
] as const;

type ReportReason = (typeof REPORT_REASONS)[number]["id"];

interface Report {
  id: string;
  postId?: string;
  commentId?: string;
  reason: ReportReason;
  description: string;
  status: "NEW" | "REVIEWED" | "REJECTED";
  createdAt: string;
}

const ModerationDashboardPage = () => {
  const { toast } = useToast();
  const router = useRouter();
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");


  const getReasonLabel = (reasonId: string): string => {
    const found = REPORT_REASONS.find((r) => r.id === reasonId);
    return found ? found.label : reasonId;
  };

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/complaints`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Ошибка при загрузке жалоб");
        }
        const data: Report[] = await response.json();
        setReports(data);
      } catch (err) {
        console.error(err);
        setError("Ошибка при загрузке жалоб");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [backendUrl]);

  const handleStatusChange = async (
    reportId: string,
    newStatus: "REVIEWED" | "REJECTED"
  ) => {
    try {
      const response = await fetch(`${backendUrl}/api/complaints`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaintId: reportId, status: newStatus }),
      });
      if (!response.ok) {
        throw new Error("Ошибка обновления статуса");
      }
      await response.json();
      toast({
        title: "Статус обновлен",
        description: `Жалоба #${reportId} помечена как ${
          newStatus === "REVIEWED" ? "решенная" : "отклоненная"
        }`,
      });
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      const error = err as Error;
      toast({
        title: "Ошибка",
        description: error.message || "Ошибка обновления статуса",
        variant: "destructive",
      });
    }
  };

  const handleViewPost = (postId: string) => {
    router.push(`/posts/${postId}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "REVIEWED":
        return (
          <Badge className="bg-green-500 text-white hover:bg-green-600">
            Решено
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="secondary" className="bg-[#ea384c] text-white hover:bg-[#ea384c]/80">
            Отклонено
          </Badge>
        );
      default:
        return (
          <Badge variant="destructive" className="bg-[#9b87f5] text-white hover:bg-[#9b87f5]/80">
            На рассмотрении
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <p>Загрузка жалоб...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <p>Ошибка: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1F2C] text-white">
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#9b87f5] to-[#7E69AB] bg-clip-text text-transparent">
              Панель модерации
            </h1>
            <p className="text-gray-400">Управление жалобами пользователей</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge
              variant="outline"
              className="flex items-center gap-1 border-[#9b87f5] text-[#9b87f5]"
            >
              <Flag className="w-4 h-4" />
              {reports.filter((r) => r.status === "NEW").length} активных
            </Badge>
          </div>
        </div>

        <div className="rounded-lg border border-[#9b87f5]/20 bg-[#222222] shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-[#2A2A2A]">
                <TableHead className="w-[100px] text-gray-400">ID</TableHead>
                <TableHead className="text-gray-400">Причина</TableHead>
                <TableHead className="text-gray-400">Описание</TableHead>
                <TableHead className="text-gray-400">Дата</TableHead>
                <TableHead className="text-gray-400">Статус</TableHead>
                <TableHead className="text-right text-gray-400">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow
                  key={report.id}
                  className="hover:bg-[#2A2A2A] border-b border-[#333333]"
                >
                  <TableCell className="font-mono text-[#9b87f5]">
                    {report.id}
                  </TableCell>
                  <TableCell className="font-medium text-gray-200">
                    {getReasonLabel(report.reason)}
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate text-gray-300">
                    {report.description}
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {formatDate(report.createdAt)}
                  </TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:text-[#9b87f5] hover:bg-[#2A2A2A]">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px] bg-[#222222] border-[#333333]">
                        {report.postId && (
                          <DropdownMenuItem
                            onClick={() => handleViewPost(report.postId as string)}
                            className="cursor-pointer hover:text-[#9b87f5] hover:bg-[#2A2A2A] text-gray-200"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Просмотр поста
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(report.id, "REVIEWED")}
                          className="cursor-pointer hover:text-green-500 hover:bg-[#2A2A2A] text-gray-200"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Решено
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(report.id, "REJECTED")}
                          className="cursor-pointer hover:text-[#ea384c] hover:bg-[#2A2A2A] text-gray-200"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Отклонить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default ModerationDashboardPage;
