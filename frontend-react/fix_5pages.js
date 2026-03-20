const fs = require('fs');
const path = require('path');

const fixes = [
    // 1. ReportsPage - remove min-h-full bg-gray-50 wrapper + upgrade heading
    {
        file: 'src/pages/superadmin/dashboard/ReportsPage.js',
        replacements: [
            [
                `<div className="min-h-full bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">`,
                `<div className="flex flex-col h-full">`
            ],
            [
                `<h1 className="text-2xl font-bold text-black font-paperlogy">Workforce Intelligence</h1>`,
                `<h1 className="text-3xl font-extrabold text-black font-paperlogy">Workforce Intelligence</h1>`
            ],
            // Remove white bg tab header strip
            [
                `<div className="p-6  border-b border-gray-200 dark:border-gray-700 shadow-sm">`,
                `<div className="p-6">`
            ],
        ]
    },
    // 2. PayslipDesignerPage - remove bg-white header strip
    {
        file: 'src/pages/superadmin/payroll/PayslipDesignerPage.js',
        replacements: [
            [
                `<div className="px-4 pt-4 pb-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">`,
                `<div className="px-6 pt-5 pb-4">`
            ],
            [
                `<h1 className="text-2xl font-bold text-black font-paperlogy">Payslip Designer</h1>`,
                `<h1 className="text-3xl font-extrabold text-black font-paperlogy">Payslip Designer</h1>`
            ],
        ]
    },
    // 3. PayslipsPage - upgrade plain bg-white action buttons to btn-secondary style
    {
        file: 'src/pages/superadmin/payroll/PayslipsPage.js',
        replacements: [
            // Permissions button
            [
                `className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg shadow-sm transition-colors font-medium" >`,
                `className="btn-secondary flex items-center gap-2">`
            ],
        ]
    },
    // 4. LeavesPage (superadmin) – check the outer wrapper
    {
        file: 'src/pages/superadmin/attendance/LeavesPage.js',
        replacements: [
            [
                `className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen`,
                `className="p-6`
            ],
            [
                `className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen`,
                `className="p-8`
            ],
            [
                `className="p-6 bg-gray-50 dark:bg-gray-900`,
                `className="p-6`
            ],
            [
                `className="p-8 bg-gray-50 dark:bg-gray-900`,
                `className="p-8`
            ],
        ]
    },
    // 5. AttendanceSummaryTable component – if it has white bg
    {
        file: 'src/components/admin/AttendanceSummaryTable.jsx',
        replacements: [
            [
                `className="bg-white dark:bg-gray-800`,
                `className="card`
            ],
            [
                `bg-white border border-gray-200 dark:border-gray-700`,
                `card`
            ],
        ]
    },
    // Also fix the stats card section in LeavesPage
    {
        file: 'src/pages/superadmin/attendance/LeavesPage.js',
        replacements: [
            // Upgrade page title
            [
                `<h1 className="text-2xl font-bold text-black font-paperlogy">Leaves Management</h1>`,
                `<h1 className="text-3xl font-extrabold text-black font-paperlogy">Leaves Management</h1>`
            ],
            [
                `<h1 className="text-xl font-bold text-gray-900 dark:text-white">Leaves Management</h1>`,
                `<h1 className="text-3xl font-extrabold text-black font-paperlogy">Leaves Management</h1>`
            ],
            // Stat cards bg-white wrappers
            [
                `className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center`,
                `className="card p-6 text-center`
            ],
            [
                `className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700`,
                `className="card p-6`
            ],
        ]
    },
];

const base = 'e:/HRMS/HRMS_Project/frontend-react';
let totalChanged = 0;

fixes.forEach(({ file, replacements }) => {
    const fullPath = path.join(base, file).replace(/\//g, '\\');
    if (!fs.existsSync(fullPath)) {
        console.log(`Skipping (not found): ${file}`);
        return;
    }
    let content = fs.readFileSync(fullPath, 'utf8');
    let changed = false;
    replacements.forEach(([from, to]) => {
        if (content.includes(from)) {
            content = content.split(from).join(to);
            console.log(`  ✓ ${path.basename(file)}: replaced "${from.substring(0, 70)}..."`);
            changed = true;
        } else {
            console.log(`  - ${path.basename(file)}: not found "${from.substring(0, 70)}..."`);
        }
    });
    if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        totalChanged++;
    }
});

console.log(`\nDone. Modified ${totalChanged} file(s).`);
