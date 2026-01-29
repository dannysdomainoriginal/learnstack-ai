import { useQuery } from "@tanstack/react-query";
import React from "react";
import { adminService } from "../../services";

const AdminDashboardChart = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "dashboard", "analytics"],
    queryFn: async () => {
      try {
        const { data } = await adminService.getAnalyticsData();
        return data;
      } catch (err) {
        toast.error(err.error);
      }
    },
    staleTime: Infinity
  });

  if (error) {
    return (
      <div className="text-red-400">
        {error.response?.data?.error ??
          "We encountered an error trying to load your dashboard"}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-6">
        {/* Title skeleton */}
        <div className="h-4 w-48 bg-slate-200 rounded animate-pulse mb-2" />

        {/* Subtitle skeleton */}
        <div className="h-3 w-64 bg-slate-100 rounded animate-pulse mb-6" />

        {/* Chart area */}
        <div className="relative h-64 w-full">
          <div className="absolute inset-0 bg-slate-100 rounded-xl animate-pulse" />

          {/* Fake bars / lines */}
          <div className="absolute inset-0 flex items-end gap-3 px-4 pb-4">
            {[40, 60, 35, 70, 50, 80, 45].map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className="flex-1 rounded bg-slate-200 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <div>AdminDashboardChart</div>;
};

export default AdminDashboardChart;
