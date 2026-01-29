import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import AdminDashboardChart from "../../components/admin/AdminDashboardChart";
import Button from "../../components/common/Button";
import {
  BookOpen,
  BrainCircuit,
  Cpu,
  FileText,
  UploadCloud,
  Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Spinner from "../../components/common/Spinner.jsx";
import { adminService } from "../../services/index.js";
import toast from "react-hot-toast";

const AdminPage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      try {
        const { data, message } = await adminService.getAdminDashboard();
        toast.success(message);
        return data;
      } catch (err) {
        toast.error(err.error);
      }
    },
    refetchInterval: 1000 * 60,
  });

  const stats = useMemo(() => {
    if (!data) return [];

    console.log(data);

    const base = {
      users: {
        icon: Users,
        gradient: "from-rose-400 to-red-500",
        shadowColor: "shadow-rose-500/25",
      },
      documents: {
        icon: FileText,
        gradient: "from-blue-400 to-cyan-500",
        shadowColor: "shadow-blue-500/25",
      },
      flashcards: {
        icon: BookOpen,
        gradient: "from-purple-400 to-pink-500",
        shadowColor: "shadow-purple-500/25",
      },
      quizzes: {
        icon: BrainCircuit,
        gradient: "from-emerald-400 to-teal-500",
        shadowColor: "shadow-emerald-500/25",
      },
      aiFiles: {
        icon: Cpu,
        gradient: "from-orange-400 to-red-500",
        shadowColor: "shadow-orange-500/25",
      },
      uploads: {
        icon: UploadCloud,
        gradient: "from-indigo-400 to-violet-500",
        shadowColor: "shadow-indigo-500/25",
      },
    };

    const smartTitle = (str) => {
      return str
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .split(" ")
        .map((w) =>
          w.length <= 2 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1),
        )
        .join(" ");
    };

    return Object.keys(data.stats).map((key) => {
      const { total, latest, ...stats } = data.stats[key];

      return {
        label: smartTitle(key),
        total,
        latest,
        stats,
        ...base[key],
      };
    });
  }, [data]);

  if (isLoading) {
    return <Spinner />;
  }

  if (error) {
    return (
      <div className="text-red-400">
        {error.response?.data?.error ??
          "We encountered an error trying to load your dashboard"}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Monitor app usage, users, and system growth in one place"
      />

      <div className="space-y-6">
        {/* Admin Chart */}
        <div>
          <AdminDashboardChart />
          <p className="mt-3 ml-2 text-[13px] font-semibold text-slate-700">
            Showing active users, weekly sign-ups, and total registered users.
          </p>
        </div>

        {/* Dashboard Overview */}
        <div>
          <div className="mb-5">
            <h1 className="text-xl font-semibold text-slate-800">
              Platform Overview
            </h1>
            <p className="text-sm text-slate-500">
              Key areas of the application and how they’re being used.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mt-8 mb-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg transition-shadow"
              >
                {/* Top section */}
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br ${stat.gradient} shadow-md`}
                  >
                    <stat.icon className="h-7 w-7 text-white" strokeWidth={2} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">
                      {stat.total}
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="my-4 h-px bg-slate-100" />

                {/* Stats row */}
                <div className="mt-8 mb-3 flex flex-col gap-2 text-sm text-slate-600">
                  <span className="flex gap-1.5">
                    Latest:
                    <span className="block font-medium text-slate-900">
                      {stat.latest}
                    </span>
                  </span>

                  {stat.stats && (
                    <span>
                      {Object.entries(stat.stats).map(([key, value]) => (
                        <span
                          key={key}
                          className="block font-semibold text-slate-900"
                        >
                          {value}{" "}
                          <span className="font-normal text-slate-500">
                            {key}
                          </span>
                        </span>
                      ))}
                    </span>
                  )}
                </div>

                {/* CTA */}
                <Link
                  to={`/admin/${stat.label.toLowerCase().split(" ").join("-")}`}
                >
                  <Button
                    className="mt-5 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                    variant="card"
                  >
                    View {stat.label}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
