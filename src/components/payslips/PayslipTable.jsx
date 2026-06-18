import React from 'react';
import { Eye, Edit2, Trash2, Download, FileText } from 'lucide-react';

const PayslipTable = ({ payslips, onView, onEdit, onDelete, onDownload }) => {
    const fmt = (val) => val ? `₹${parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—';

    return (
        <div className="bg-white dark:bg-slate-900/40 p-5 rounded-10 shadow-xl dark:shadow-[0_25px_30px_-5px_rgba(0,0,0,0.7),0_10px_15px_-5px_rgba(0,185,205,0.2)] border border-transparent hover:shadow-2xl dark:hover:shadow-[0_45px_70px_-20px_rgba(0,0,0,0.9),0_10px_15px_-5px_rgba(0,185,205,0.3)] transition-all duration-300 border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out border-2 border-slate-50/50 dark:border-white/5">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white dark:bg-white/5 border-b-2 border-slate-100 dark:border-white/5 text-[10px] uppercase font-black text-slate-400 tracking-widest whitespace-nowrap">
                            <th className="px-8 py-6">Employee</th>
                            <th className="px-5 py-6">Month of Record</th>
                            <th className="px-4 py-6 text-right">Basic</th>
                            <th className="px-4 py-6 text-right">HRA</th>
                            <th className="px-4 py-6 text-right">PF</th>
                            <th className="px-4 py-6 text-right">ESIC</th>
                            <th className="px-4 py-6 text-right">PTAX</th>
                            <th className="px-8 py-6 text-right text-[#00b9cd] dark:text-[#00b9cd]">Net Allocation</th>
                            <th className="px-8 py-6 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                        {payslips.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="px-6 py-24 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-10 shadow-xl dark:shadow-[0_25px_30px_-5px_rgba(0,0,0,0.7),0_10px_15px_-5px_rgba(0,185,205,0.2)] border border-transparent hover:shadow-2xl dark:hover:shadow-[0_45px_70px_-20px_rgba(0,0,0,0.9),0_10px_15px_-5px_rgba(0,185,205,0.3)] transition-all duration-300 border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out">
                                            <FileText size={48} className="text-slate-200" />
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 dark:text-white text-lg uppercase tracking-tight">No Archive Found</p>
                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1">Try adjusting your filters or generate new records</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            payslips.map((payslip) => (
                                <tr
                                    key={payslip.id}
                                    className="hover:bg-[#00b9cd]/10/30 dark:hover:bg-[#00b9cd]/80/5 group"
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-10 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white font-black text-sm shadow-xl dark:shadow-[0_25px_30px_-5px_rgba(0,0,0,0.7),0_10px_15px_-5px_rgba(0,185,205,0.2)] border border-transparent hover:shadow-2xl dark:hover:shadow-[0_45px_70px_-20px_rgba(0,0,0,0.9),0_10px_15px_-5px_rgba(0,185,205,0.3)] transition-all duration-300 border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out group-hover:scale-110 transition-transform duration-500 shrink-0 border border-slate-50 dark:border-white/5">
                                                {(payslip.employee?.user?.name || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">
                                                    {payslip.employee?.user?.name || 'Unknown'}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">
                                                    {payslip.employee?.employee_code || '—'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-6 text-[10px] font-black text-slate-500 dark:text-slate-400 whitespace-nowrap uppercase tracking-widest">
                                        {new Date(0, payslip.month - 1).toLocaleString('default', { month: 'long' })} {payslip.year}
                                    </td>
                                    <td className="px-4 py-6 text-right text-xs font-bold text-slate-600 dark:text-slate-400">{fmt(payslip.basic)}</td>
                                    <td className="px-4 py-6 text-right text-xs font-bold text-slate-600 dark:text-slate-400">{fmt(payslip.hra)}</td>
                                    <td className="px-4 py-6 text-right text-xs font-black text-red-500/80 italic">-{fmt(payslip.pf)}</td>
                                    <td className="px-4 py-6 text-right text-xs font-black text-red-500/80 italic">-{fmt(payslip.esic)}</td>
                                    <td className="px-4 py-6 text-right text-xs font-black text-red-500/80 italic">-{fmt(payslip.ptax)}</td>
                                    <td className="px-8 py-6 text-right text-lg font-black text-[#00b9cd] dark:text-[#00b9cd] font-paperlogy tracking-tight">
                                        {fmt(payslip.net_pay)}
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap">
                                        <div className="flex items-center justify-center gap-3">
                                            {/* Action Buttons */}
                                            <button
                                                onClick={() => onView(payslip)}
                                                className="p-3 rounded-10 bg-white dark:bg-slate-800 text-slate-400 hover:text-[#00b9cd] hover:shadow-xl dark:shadow-[0_25px_30px_-5px_rgba(0,0,0,0.7),0_10px_15px_-5px_rgba(0,185,205,0.2)] border border-transparent hover:shadow-2xl dark:hover:shadow-[0_45px_70px_-20px_rgba(0,0,0,0.9),0_10px_15px_-5px_rgba(0,185,205,0.3)] transition-all duration-300 border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out active:translate-y-0.5 shadow-sm border border-slate-50 dark:border-white/5"
                                                title="View Details"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => onEdit(payslip)}
                                                className="p-3 rounded-10 bg-white dark:bg-slate-800 text-slate-400 hover:text-orange-600 hover:shadow-xl dark:shadow-[0_25px_30px_-5px_rgba(0,0,0,0.7),0_10px_15px_-5px_rgba(0,185,205,0.2)] border border-transparent hover:shadow-2xl dark:hover:shadow-[0_45px_70px_-20px_rgba(0,0,0,0.9),0_10px_15px_-5px_rgba(0,185,205,0.3)] transition-all duration-300 border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out active:translate-y-0.5 shadow-sm border border-slate-50 dark:border-white/5"
                                                title="Edit Payslip"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => onDownload(payslip)}
                                                className="p-3 rounded-10 bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 hover:shadow-xl dark:shadow-[0_25px_30px_-5px_rgba(0,0,0,0.7),0_10px_15px_-5px_rgba(0,185,205,0.2)] border border-transparent hover:shadow-2xl dark:hover:shadow-[0_45px_70px_-20px_rgba(0,0,0,0.9),0_10px_15px_-5px_rgba(0,185,205,0.3)] transition-all duration-300 border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out active:translate-y-0.5 shadow-sm border border-slate-50 dark:border-white/5"
                                                title="Download PDF"
                                            >
                                                <Download size={16} />
                                            </button>
                                            <button
                                                onClick={() => onDelete(payslip)}
                                                className="p-3 rounded-10 bg-white dark:bg-slate-800 text-slate-400 hover:text-red-600 hover:shadow-xl dark:shadow-[0_25px_30px_-5px_rgba(0,0,0,0.7),0_10px_15px_-5px_rgba(0,185,205,0.2)] border border-transparent hover:shadow-2xl dark:hover:shadow-[0_45px_70px_-20px_rgba(0,0,0,0.9),0_10px_15px_-5px_rgba(0,185,205,0.3)] transition-all duration-300 border-2 border-transparent hover:border-[#00b9cd] dark:hover:border-[#00b9cd] transition-all duration-500 ease-out active:translate-y-0.5 shadow-sm border border-slate-50 dark:border-white/5"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PayslipTable;
