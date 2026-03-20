import React from 'react';
import { Eye, Edit2, Trash2, Download, FileText } from 'lucide-react';

const PayslipTable = ({ payslips, onView, onEdit, onDelete, onDownload }) => {
    const fmt = (val) => val ? `₹${parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—';

    return (
        <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b-2 border-black bg-gradient-to-r from-brand-500/10 to-coral-400/10 text-xs uppercase font-extrabold text-black tracking-widest whitespace-nowrap">
                            <th className="px-6 py-4">Employee</th>
                            <th className="px-5 py-4">Month</th>
                            <th className="px-4 py-4 text-right">Basic</th>
                            <th className="px-4 py-4 text-right">HRA</th>
                            <th className="px-4 py-4 text-right text-red-600">PF ↓</th>
                            <th className="px-4 py-4 text-right text-red-600">ESIC ↓</th>
                            <th className="px-4 py-4 text-right text-red-600">PTAX ↓</th>
                            <th className="px-6 py-4 text-right text-green-700 bg-green-50/60">Net Pay</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {payslips.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="bg-gray-100 p-4 rounded-2xl">
                                            <FileText size={40} className="text-gray-300" />
                                        </div>
                                        <p className="font-bold text-gray-500 text-base">No payslips found</p>
                                        <p className="text-sm text-gray-400">Try adjusting your filters or generate payslips first.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            payslips.map((payslip) => (
                                <tr
                                    key={payslip.id}
                                    className="hover:bg-brand-50/30 transition-colors group"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-black text-sm border-2 border-black shadow-[1px_1px_0px_black] shrink-0">
                                                {(payslip.employee?.user?.name || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-black text-sm">
                                                    {payslip.employee?.user?.name || 'Unknown'}
                                                </div>
                                                <div className="text-xs text-gray-500 font-medium">
                                                    {payslip.employee?.employee_code || '—'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-sm font-bold text-gray-800 whitespace-nowrap">
                                        {new Date(0, payslip.month - 1).toLocaleString('default', { month: 'long' })} {payslip.year}
                                    </td>
                                    <td className="px-4 py-4 text-right text-sm font-semibold text-gray-700">{fmt(payslip.basic)}</td>
                                    <td className="px-4 py-4 text-right text-sm font-semibold text-gray-700">{fmt(payslip.hra)}</td>
                                    <td className="px-4 py-4 text-right text-sm font-bold text-red-500">{fmt(payslip.pf)}</td>
                                    <td className="px-4 py-4 text-right text-sm font-bold text-red-500">{fmt(payslip.esic)}</td>
                                    <td className="px-4 py-4 text-right text-sm font-bold text-red-500">{fmt(payslip.ptax)}</td>
                                    <td className="px-6 py-4 text-right text-sm font-black text-green-700 bg-green-50/50">
                                        {fmt(payslip.net_pay)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <button
                                                onClick={() => onView(payslip)}
                                                className="p-1.5 rounded-lg border-2 border-black bg-white text-blue-600 hover:bg-blue-50 hover:shadow-button transition-all"
                                                title="View Details"
                                            >
                                                <Eye size={15} />
                                            </button>
                                            <button
                                                onClick={() => onEdit(payslip)}
                                                className="p-1.5 rounded-lg border-2 border-black bg-white text-amber-600 hover:bg-amber-50 hover:shadow-button transition-all"
                                                title="Edit Payslip"
                                            >
                                                <Edit2 size={15} />
                                            </button>
                                            <button
                                                onClick={() => onDownload(payslip)}
                                                className="p-1.5 rounded-lg border-2 border-black bg-white text-purple-600 hover:bg-purple-50 hover:shadow-button transition-all"
                                                title="Download PDF"
                                            >
                                                <Download size={15} />
                                            </button>
                                            <button
                                                onClick={() => onDelete(payslip)}
                                                className="p-1.5 rounded-lg border-2 border-red-300 bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                                                title="Delete"
                                            >
                                                <Trash2 size={15} />
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
