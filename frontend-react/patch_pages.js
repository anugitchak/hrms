const fs = require('fs');

// List of all pages the user said are broken or have white backgrounds
const fixes = [
    // DesignationManagement component (shared, used by superadmin designations page)
    {
        file: 'e:/HRMS/HRMS_Project/frontend-react/src/components/DesignationManagement.jsx',
        replacements: [
            // Page wrapper
            [
                `<div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-200">`,
                `<div className="p-8">`
            ],
            // Header bar - remove the bg-white header strip
            [
                `<div className="flex justify-between items-center p-6 border-b bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm">`,
                `<div className="flex justify-between items-center mb-6">`
            ],
            // h1 in header
            [
                `<h1 className="text-2xl font-bold text-gray-800 dark:text-white">Designations</h1>`,
                `<h1 className="text-3xl font-extrabold text-black font-paperlogy">Designations</h1>`
            ],
            // Subtitle
            [
                `<p className="text-sm text-gray-500 dark:text-gray-400">Define hierarchy and organizational titles</p>`,
                `<p className="text-sm font-medium text-gray-900">Define hierarchy and organizational titles</p>`
            ],
            // Add button
            [
                `className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow transition duration-150 ease-in-out"`,
                `className="btn-primary flex items-center gap-2"`
            ],
            // Content area - remove padding and overflow since page wrapper has it now
            [
                `<div className="flex-1 overflow-auto p-6">`,
                `<div className="flex-1">`
            ],
            // Search bar wrapper card
            [
                `<div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 items-center">`,
                `<div className="card p-4 flex flex-wrap gap-4 items-center">`
            ],
            // Search input
            [
                `className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"`,
                `className="w-full pl-10 pr-4 py-2.5 border-2 border-black rounded-lg outline-none bg-white text-black focus:ring-4 focus:ring-brand-500 font-medium"`
            ],
            // Table wrapper
            [
                `<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">`,
                `<div className="card overflow-hidden mt-4">`
            ],
            // Table header row
            [
                `<tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">`,
                `<tr className="bg-brand-50 border-b-2 border-black">`
            ],
            // All th elements header text color
            [
                `text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider`,
                `text-xs font-bold text-gray-900 uppercase tracking-wider`
            ],
            // Table row hover
            [
                `<tr key={designation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">`,
                `<tr key={designation.id} className="hover:bg-brand-50/50 transition-colors border-b-2 border-black/5">`
            ],
            // Modal wrapper
            [
                `<div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in duration-200">`,
                `<div className="card w-full max-w-md">`
            ],
            // Modal header border
            [
                `<div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">`,
                `<div className="flex justify-between items-center p-6 border-b-2 border-black">`
            ],
            // Modal save button
            [
                `className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"`,
                `className="flex-1 btn-primary flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"`
            ],
            // Modal cancel button
            [
                `className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"`,
                `className="flex-1 btn-secondary"`
            ],
            // Input in modal
            [
                `className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"`,
                `className="w-full px-4 py-3 rounded-lg border-2 border-black bg-white text-black focus:ring-4 focus:ring-brand-500 outline-none font-medium"`
            ],
            // Textarea in modal
            [
                `className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors resize-none h-24"`,
                `className="w-full px-4 py-3 rounded-lg border-2 border-black bg-white text-black focus:ring-4 focus:ring-brand-500 outline-none font-medium resize-none h-24"`
            ],
        ]
    },
    // MeetingsPage - remove bg-gray-50 wrapper
    {
        file: 'e:/HRMS/HRMS_Project/frontend-react/src/pages/admin/MeetingsPage.jsx',
        replacements: [
            [
                `<div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-full">`,
                `<div className="p-6">`
            ],
            // H1 heading
            [
                `<h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">`,
                `<h1 className="text-3xl font-extrabold text-black font-paperlogy flex items-center gap-2">`
            ],
            // Meeting card
            [
                `className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-all group overflow-hidden relative"`,
                `className="card p-6 hover:shadow-lg transition-all group overflow-hidden relative border-b-4 border-black/10"`
            ],
            // Schedule button
            [
                `className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm transition-all"`,
                `className="btn-primary flex items-center gap-2"`
            ],
            // Empty state card
            [
                `className="col-span-full p-12 text-center bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700"`,
                `className="col-span-full p-12 text-center card border-2 border-dashed border-black/20"`
            ],
        ]
    },
    // Admin TasksPage - if it exists with a white bg
    {
        file: 'e:/HRMS/HRMS_Project/frontend-react/src/pages/admin/TasksPage.jsx',
        replacements: [
            [`bg-white dark:bg-gray-900 min-h-screen`, ``],
            [`bg-gray-50 dark:bg-gray-900 min-h-screen`, ``],
            [`bg-gray-50 dark:bg-gray-900 min-h-full`, ``],
        ]
    },
];

let totalChanged = 0;

fixes.forEach(({ file, replacements }) => {
    if (!require('fs').existsSync(file)) {
        console.log('Skipping (not found): ' + file);
        return;
    }
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    replacements.forEach(([from, to]) => {
        if (content.includes(from)) {
            content = content.split(from).join(to);
            console.log(`  ✓ Replaced in ${require('path').basename(file)}: "${from.substring(0, 60)}..."`);
            changed = true;
        } else {
            console.log(`  - Not found in ${require('path').basename(file)}: "${from.substring(0, 60)}..."`);
        }
    });

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        totalChanged++;
        console.log(`Saved: ${file}`);
    }
});

console.log(`\nDone. Modified ${totalChanged} file(s).`);
