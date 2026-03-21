import React from "react";
import { Star, Clock } from "lucide-react";

const PerformanceReviewsPage = () => {
    return (
        <div className="p-10 max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-12">
                <h1 className="text-5xl font-black text-slate-900 dark:text-white font-paperlogy tracking-tight lowercase">
                    <span className="italic">Performance</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">Reviews</span>
                </h1>
                <div className="flex items-center gap-3 mt-4">
                    <span className="h-1.5 w-12 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"></span>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Module Status: Under Construction</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-12 rounded-[3rem] border-2 border-slate-900/10 shadow-[8px_8px_0px_0px_rgba(71,85,105,0.05)] text-center">
                <div className="w-20 h-20 bg-teal-50 dark:bg-teal-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Star className="text-teal-500" size={32} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 font-paperlogy uppercase tracking-tight">Intelligence Evaluation</h2>
                <p className="max-w-md mx-auto text-slate-500 font-bold text-sm leading-relaxed mb-8">
                    The performance matrix and agent evaluation protocols are currently being synchronized. This module will allow for detailed KPI tracking and performance scoring.
                </p>
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-teal-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">
                    <Clock size={14} />
                    Deployment Pending
                </div>
            </div>
        </div>
    );
};

export default PerformanceReviewsPage;