const fs = require('fs');
const path = 'e:\\HRMS\\HRMS_Project\\frontend-react\\src\\pages\\superadmin\\system\\SettingsPage.js';
let c = fs.readFileSync(path, 'utf8');

// Find and replace the big card wrapper section
const oldMark = '{/* Permissions Section */} <div className="card dark:border-gray-700 overflow-hidden">';
const closeMark = '{/* Info Card */}';

const startIdx = c.indexOf(oldMark);
const endIdx = c.indexOf(closeMark);

if (startIdx === -1) {
    console.log('Old section marker NOT FOUND.');
    console.log('First 5000 chars of file:', c.substring(0, 3000));
    process.exit(1);
}

const newSection = `{/* Permissions Header */} <div className="flex items-center justify-between mb-6"> <div> <h2 className="text-xl font-extrabold text-black font-paperlogy">{activeRole?.name} Permissions</h2> <p className="text-sm font-medium text-gray-600 mt-1">Toggle permissions for all {activeRole?.name} users</p> </div> <div className="flex items-center gap-3"> <button onClick={handleEnableAll} className="px-4 py-2 text-sm font-bold text-green-700 bg-green-50 border-2 border-green-300 hover:bg-green-100 rounded-lg transition-colors">Enable All</button> <button onClick={handleDisableAll} className="px-4 py-2 text-sm font-bold text-red-700 bg-red-50 border-2 border-red-300 hover:bg-red-100 rounded-lg transition-colors">Disable All</button> </div> </div> <div className="space-y-6"> {Object.entries(groupedPermissions).map(([category, permissions]) => ( <div key={category} className="card p-5"> <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-black/10"> <h3 className="text-sm font-extrabold text-black uppercase tracking-widest">{category}</h3> <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{permissions.length}</span> </div> <div className="grid grid-cols-1 md:grid-cols-2 gap-3"> {permissions.map(permission => ( <PermissionCard key={permission.key} permission={permission} enabled={activeRole?.permissions?.[permission.key] || false} onChange={(value) => handlePermissionChange(permission.key, value)} disabled={saving} /> ))} </div> </div> ))} </div> <div className="flex items-center justify-between mt-6 p-4 card"> <div className="text-sm font-medium text-gray-600"> {hasChanges && ( <span className="flex items-center gap-2"> <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span> <span className="font-bold text-orange-600">Unsaved changes</span> </span> )} </div> <button onClick={handleSave} disabled={saving || !hasChanges} className={\`btn-primary flex items-center gap-2 \${saving || !hasChanges ? 'opacity-50 cursor-not-allowed' : ''}\`}> {saving ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Saving...</>) : (<><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>Save Changes</>)} </button> </div> `;

const before = c.substring(0, startIdx);
const after = c.substring(endIdx);
const result = before + newSection + after;

fs.writeFileSync(path, result, 'utf8');
console.log('SUCCESS: SettingsPage split into per-category cards');
console.log('Start idx:', startIdx, '| End idx:', endIdx);
