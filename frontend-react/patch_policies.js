const fs = require('fs');

let content = fs.readFileSync('e:\\HRMS\\HRMS_Project\\frontend-react\\src\\pages\\superadmin\\policies\\LeavePoliciesPage.js', 'utf8');

// Replace the Leave Policies list mapping
// From:
// <div className="grid grid-cols-1 gap-4"> {categoryPolicies.map(policy => ( <div key={policy.id} className="card p-0 mb-4 cursor-pointer overflow-hidden group">
// To a nicer grid format
const targetStr = '<div className="grid grid-cols-1 gap-4"> {categoryPolicies.map(policy => ( <div key={policy.id} className="card p-0 mb-4 cursor-pointer overflow-hidden group">';

if (content.includes(targetStr)) {
    const replacement = `<div className="grid grid-cols-1 lg:grid-cols-2 gap-6"> {categoryPolicies.map(policy => ( <div key={policy.id} className="card p-0 cursor-pointer overflow-hidden group border-2 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all duration-200">`;
    // Replace the opening tag to use lg:grid-cols-2 and have space-y-none as we use gap-6
    content = content.replace(targetStr, replacement);
    fs.writeFileSync('e:\\HRMS\\HRMS_Project\\frontend-react\\src\\pages\\superadmin\\policies\\LeavePoliciesPage.js', content, 'utf8');
    console.log('Successfully patched LeavePoliciesPage grid layout.');
} else {
    // try to find it dynamically
    const fallbackStr = '<div className="grid grid-cols-1 gap-4">';
    if (content.includes(fallbackStr)) {
        content = content.replace(fallbackStr, '<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">');
        
        // Also add hover effects to the card
        content = content.replaceAll(
          'className="card p-0 mb-4 cursor-pointer overflow-hidden group"', 
          'className="card p-0 cursor-pointer overflow-hidden group border-2 border-black hover:-translate-y-1 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] transition-all duration-200 flex flex-col"'
        );

        content = content.replaceAll(
          'className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg',
          'className="px-3 py-1.5 text-xs font-extrabold text-blue-800 bg-blue-100 hover:bg-blue-200 border-2 border-blue-400 rounded-lg drop-shadow-[2px_2px_0px_rgba(0,0,0,0.2)]'
        );

        content = content.replaceAll(
          'className="px-3 py-1.5 text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg',
          'className="px-3 py-1.5 text-xs font-extrabold text-purple-800 bg-purple-100 hover:bg-purple-200 border-2 border-purple-400 rounded-lg drop-shadow-[2px_2px_0px_rgba(0,0,0,0.2)]'
        );
        
        fs.writeFileSync('e:\\HRMS\\HRMS_Project\\frontend-react\\src\\pages\\superadmin\\policies\\LeavePoliciesPage.js', content, 'utf8');
        console.log('Successfully patched LeavePoliciesPage grid layout via fallback.');
    } else {
        console.log('Could not find the target string.');
    }
}
