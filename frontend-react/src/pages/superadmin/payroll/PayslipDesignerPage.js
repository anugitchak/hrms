import React from 'react'; import PayslipDesigner from '../../../components/payslips/PayslipDesigner'; const PayslipDesignerPage = () => {
    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-5xl md:text-5xl font-black text-slate-900 dark:text-white font-paperlogy tracking-tight leading-none">
                        <span className="italic">Payslip</span> <span className="text-transparent bg-clip-text bg-[#00b9cd]">Designer</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-3">
                        <span className="h-1.5 w-12 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full shadow-lg shadow-teal-500/20"></span>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Design Custom Templates</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <PayslipDesigner isSuperAdmin={true} readOnly={false} />
            </div>
        </div>
    );
};
 export default PayslipDesignerPage;