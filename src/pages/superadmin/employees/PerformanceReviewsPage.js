import React from "react";
import { Star, Clock } from "lucide-react";

const PerformanceReviewsPage = () => {
    return (
        <div className="p-10 max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-12">
                <h1 className="text-5xl font-black text-slate-900 dark:text-white font-paperlogy tracking-tight lowercase">
                    Performance <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00b9cd] to-emerald-600">Reviews</span>
                </h1>
                <div className="flex items-center gap-3 mt-4">
                    <span className="h-1.5 w-12 bg-[#f06464] rounded-10"></span>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Module Status: Under Construction</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-12 rounded-10 border-2 border-slate-900/10 shadow-md dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-2px_rgba(0,185,205,0.1)] border border-transparent hover:shadow-lg dark:hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,185,205,0.15)] border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out text-center">
                <div className="w-20 h-20 bg-[#00b9cd]/10 dark:bg-[#00b9cd]/10 rounded-10 flex items-center justify-center mx-auto mb-6">
                    <Star className="text-[#00b9cd]" size={32} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 font-paperlogy uppercase tracking-tight">Intelligence Evaluation</h2>
                <p className="max-w-md mx-auto text-slate-500 font-bold text-sm leading-relaxed mb-8">
                    The performance matrix and agent evaluation protocols are currently being synchronized. This module will allow for detailed KPI tracking and performance scoring.
                </p>
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-[#00b9cd] text-white rounded-10 text-[10px] font-black uppercase tracking-widest">
                    <Clock size={14} />
                    Deployment Pending
                </div>
            </div>
        </div>
    );
};

export default PerformanceReviewsPage;