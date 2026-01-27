import React from "react";

const NotFoundPage = () => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h1 className="text-2xl font-medium text-slate-900  tracking-tight mb-2">
          404 Not Found
        </h1>
        <p className="text-slate-600 text-lg">
          The page you're looking for does not exist 🔍
        </p>
      </div>
    </div>
  );
};

export default NotFoundPage;
