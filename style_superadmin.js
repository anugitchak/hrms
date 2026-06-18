const fs = require('fs');
const path = require('path');

const superadminDir = 'e:/HRMS/HRMS_Project/frontend-react/src/pages/superadmin';

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(file));
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walkDir(superadminDir);
let modifiedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // =====================================================================
    // 1. PAGE CONTAINER - Remove white/gray/dark backgrounds from top divs
    // Replace "p-X bg-white ..." or "p-X bg-gray-50 ..." top level page containers
    // =====================================================================
    content = content.replace(/className="(p-[0-9]+ )(?:bg-white|bg-gray-50|bg-gray-900|dark:bg-gray-900)(?: dark:[^ "]+)?(?: min-h-screen)?(?: transition-colors duration-200)?([^"]*)"/g, 
        'className="$1$2"'
    );
    // Also strip any standalone "bg-white dark:bg-gray-900 min-h-screen" etc. from container elements
    content = content.replace(/\s*bg-white\s+dark:bg-gray-[0-9]+\s+min-h-screen\s+transition-colors\s+duration-200/g, '');
    content = content.replace(/\s*bg-gray-50\s+dark:bg-gray-[0-9]+\s+min-h-screen\s+transition-colors\s+duration-200/g, '');
    content = content.replace(/\s*bg-gray-50\s+dark:bg-gray-[0-9]+\s+min-h-screen/g, '');

    // =====================================================================
    // 2. CARD COMPONENTS - standardize all cards
    // =====================================================================
    // bg-white ... rounded-xl shadow-sm border border-gray-200 -> .card
    content = content.replace(/className="([^"]*)bg-white(?: dark:bg-gray-[0-9]+)? rounded-xl shadow-sm border border-gray-200(?: dark:border-gray-[0-9]+)?([^"]*)"/g, 'className="$1card$2"');
    // bg-white ... rounded-lg shadow-sm border border-gray-200 -> .card
    content = content.replace(/className="([^"]*)bg-white(?: dark:bg-gray-[0-9]+)? (?:p-[0-9]+ )?rounded-lg shadow-sm border border-gray-200(?: dark:border-gray-[0-9]+)?([^"]*)"/g, (m, pre, post) => {
        const pMatch = m.match(/p-(\d+)/)?.[0] || '';
        return `className="${pre}card ${pMatch}${post}"`;
    });
    // bg-white rounded-xl border -> .card
    content = content.replace(/className="([^"]*)bg-white(?: dark:bg-gray-[0-9]+)? rounded-xl border(?: border-gray-[0-9]+)?([^"]*)"/g, 'className="$1card$2"');
    // bg-white rounded-2xl border -> .card
    content = content.replace(/className="([^"]*)bg-white(?: dark:bg-gray-[0-9]+)? rounded-2xl(?: shadow[^ "]*)? border(?: border-gray-[0-9]+)?([^"]*)"/g, 'className="$1card$2"');
    // bg-white p-6 rounded -> .card p-6
    content = content.replace(/className="([^"]*)bg-white(?: dark:bg-gray-[0-9]+)? p-6 rounded([^"]*)"/g, 'className="$1card p-6 rounded$3"');
    content = content.replace(/className="([^"]*)bg-white(?: dark:bg-gray-[0-9]+)? p-5 rounded([^"]*)"/g, 'className="$1card p-5 rounded$3"');
    content = content.replace(/className="([^"]*)bg-white(?: dark:bg-gray-[0-9]+)? p-4 rounded([^"]*)"/g, 'className="$1card p-4 rounded$3"');
    content = content.replace(/className="([^"]*)bg-white(?: dark:bg-gray-[0-9]+)? p-8 rounded([^"]*)"/g, 'className="$1card p-8 rounded$3"');

    // bg-gray-50 card-like container
    content = content.replace(/className="([^"]*)bg-gray-50(?: dark:bg-gray-[0-9]+\/[0-9]+)? rounded-[a-z]+(?: shadow-[a-z]+)? (?:border|p-)([^"]*)"/g, 'className="$1card p-$3"');

    // =====================================================================
    // 3. BUTTONS - standardize
    // =====================================================================
    // Primary buttons
    content = content.replace(/className="([^"]*)px-[0-9]+ py-[0-9]+ (?:rounded[a-z-]*) (?:text-sm )?(?:font-medium )?bg-blue-600 text-white hover:bg-blue-700 transition-colors([^"]*)"/g, 'className="$1btn-primary$2"');
    content = content.replace(/className="([^"]*)bg-blue-600 text-white(?: rounded[a-z-]*)? hover:bg-blue-700([^"]*)"/g, 'className="$1btn-primary$3"');
    content = content.replace(/className="([^"]*)bg-teal-600 text-white.{0,50}hover:bg-teal-700([^"]*)"/g, 'className="$1btn-primary$3"');
    content = content.replace(/className="([^"]*)bg-brand-600 text-white.{0,50}hover:bg-brand-700([^"]*)"/g, 'className="$1btn-primary$3"');

    // Secondary buttons
    content = content.replace(/className="([^"]*)px-4 py-2 (?:rounded[a-z-]* )?(?:text-sm )?(?:font-medium )?border border-gray-300(?: dark:border-gray-[0-9]+)? bg-white(?: dark:bg-gray-[0-9]+)? text-gray-700(?: dark:text-gray-[0-9]+)? hover:bg-gray-50(?: dark:hover:bg-gray-[0-9]+)?([^"]*)"/g, 'className="$1btn-secondary$2"');
    content = content.replace(/className="([^"]*)bg-gray-100(?: dark:bg-gray-[0-9]+)? text-gray-700(?: dark:text-gray-[0-9]+)? px-[0-9]+ py-[0-9]+ rounded[a-z-]* hover:bg-gray-200(?: dark:hover:bg-gray-[0-9]+)? transition-colors([^"]*)"/g, 'className="$1btn-secondary$2"');
    content = content.replace(/className="([^"]*)px-4 py-2 rounded[a-z-]* font-medium bg-white(?: dark:bg-gray-[0-9]+)? text-gray-700([^"]*)hover:bg-gray-50([^"]*)transition-colors([^"]*)"/g, 'className="$1btn-secondary$5"');

    // Delete/danger buttons
    content = content.replace(/className="([^"]*)bg-red-600 text-white.{0,50}hover:bg-red-700([^"]*)"/g, 'className="$1btn-accent bg-red-500 hover:bg-red-600 text-white border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]$3"');

    // =====================================================================
    // 4. TABLE HEADERS - standardize
    // =====================================================================
    content = content.replace(/className="([^"]*)bg-gray-50(?: dark:bg-gray-[0-9]+(?:\/[0-9]+)?)? border-b(?: border-gray-[0-9]+)?([^"]*)"/g, 'className="$1bg-brand-50 border-b-2 border-black$3"');
    content = content.replace(/className="([^"]*)bg-gray-50(?: dark:bg-gray-[0-9]+)?"([^>]*)>[\s\S]*?<tr>/g, (m) => m.replace('bg-gray-50', 'bg-brand-50'));

    // =====================================================================
    // 5. TABLE ROW HOVER - standardize
    // =====================================================================
    content = content.replace(/hover:bg-gray-50(?: dark:hover:bg-gray-[0-9]+\/50)? transition-colors/g, 'hover:bg-brand-50/50 transition-colors border-b-2 border-black/5');

    // =====================================================================
    // 6. INPUTS/SELECTS - upgrade border style
    // =====================================================================
    content = content.replace(/className="([^"]*)border border-gray-300(?: dark:border-gray-[0-9]+)? rounded[a-z-]*(?: outline-none)?([^"]*)focus:ring-2 focus:ring-blue-[0-9]+([^"]*)"/g, 
        'className="$1border-2 border-black rounded-lg outline-none$2focus:ring-4 focus:ring-brand-500 font-medium$3"'
    );
    content = content.replace(/className="([^"]*)border border-gray-300(?: dark:border-gray-[0-9]+)? rounded-lg([^"]*)focus:border-blue-500([^"]*)"/g, 
        'className="$1border-2 border-black rounded-lg$2focus:ring-4 focus:ring-brand-500 font-medium$3"'
    );
    
    // =====================================================================
    // 7. TYPOGRAPHY - make headers bolder and more prominent
    // =====================================================================
    // Page main title
    content = content.replace(/className="([^"]*)text-2xl font-bold text-gray-800(?: dark:text-white)?([^"]*)"/g, 'className="$1text-3xl font-extrabold text-black font-paperlogy$2"');
    content = content.replace(/className="([^"]*)text-2xl font-bold text-gray-900(?: dark:text-white)?([^"]*)"/g, 'className="$1text-3xl font-extrabold text-black font-paperlogy$2"');
    content = content.replace(/className="([^"]*)text-xl font-bold text-gray-800(?: dark:text-white)?([^"]*)"/g, 'className="$1text-2xl font-bold text-black font-paperlogy$2"');
    content = content.replace(/className="([^"]*)text-xl font-bold text-gray-900(?: dark:text-white)?([^"]*)"/g, 'className="$1text-2xl font-bold text-black font-paperlogy$2"');
    // Section headings  
    content = content.replace(/className="([^"]*)text-lg font-semibold text-gray-[0-9]+(?: dark:text-[a-z-0-9]+)?([^"]*)"/g, 'className="$1text-xl font-bold text-black$2"');
    // Subtitle/desc text
    content = content.replace(/className="([^"]*)text-sm text-gray-400(?: dark:text-gray-[0-9]+)?([^"]*)"/g, 'className="$1text-sm font-medium text-gray-900$2"');
    content = content.replace(/className="([^"]*)text-sm text-gray-500(?: dark:text-gray-[0-9]+)?([^"]*)"/g, 'className="$1text-sm font-medium text-gray-900$2"');
    // Generic text-gray-500 -> text-gray-900
    content = content.replace(/text-gray-500(?: dark:text-gray-[0-9]+)?/g, 'text-gray-900');

    // =====================================================================
    // 8. MODAL OVERLAYS - normalize
    // =====================================================================
    content = content.replace(/className="([^"]*)fixed inset-0 bg-black(?:\/[0-9]+)? (?:dark:bg-black\/[0-9]+)?flex items-center justify-center([^"]*)"/g, 
        'className="$1fixed inset-0 bg-black/60 flex items-center justify-center z-50$2"'
    );
    content = content.replace(/className="([^"]*)fixed inset-0 bg-gray-500(?:\/[0-9]+)? flex([^"]*)"/g, 
        'className="$1fixed inset-0 bg-black/60 flex$2"'
    );

    // =====================================================================
    // 9. Stat / metric number text - make bolder
    // =====================================================================
    content = content.replace(/className="([^"]*)text-3xl font-bold text-gray-[0-9]+(?: dark:text-white)?([^"]*)"/g, 'className="$1text-4xl font-extrabold text-black dark:text-white$2"');
    content = content.replace(/className="([^"]*)text-2xl font-bold text-[a-z]+-600([^"]*)"/g, 'className="$1text-3xl font-extrabold text-$3-600$4"');
    
    // =====================================================================
    // 10. Badge text -- normalize xs labels
    // =====================================================================
    content = content.replace(/className="([^"]*)text-xs text-gray-500 uppercase tracking-wider([^"]*)"/g, 'className="$1text-xs font-bold text-gray-900 uppercase tracking-widest$2"');

    if (original !== content) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Styled: ' + path.relative(superadminDir, file));
        modifiedCount++;
    }
});

console.log(`\nDone! Modified ${modifiedCount} of ${files.length} superadmin pages.`);
