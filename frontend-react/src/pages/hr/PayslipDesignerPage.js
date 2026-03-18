import React from 'react';
import PayslipDesigner from '../../components/payslips/PayslipDesigner';

const HRPayslipDesignerPage = () => {
    return (
        <div className="h-full flex flex-col" style={{ minHeight: 'calc(100vh - 56px)' }}>
            <div className="px-4 pt-4 pb-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Payslip Template</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Design a custom payslip template — drag elements onto the canvas, configure properties, and activate it for payslip generation.
                    </p>
                </div>
            </div>
            <div className="flex-1 overflow-hidden">
                <PayslipDesigner isSuperAdmin={false} readOnly={false} />
            </div>
        </div>
    );
};

export default HRPayslipDesignerPage;
