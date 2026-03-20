const fs = require('fs');

function replaceTableWithCards(filePath, isSubCompanies) {
    let content = fs.readFileSync(filePath, 'utf8');
    const marker = 'card p-0 overflow-hidden overflow-hidden';
    const wrapStart = '<div className="' + marker + '">';
    const startIdx = content.indexOf(wrapStart);
    if (startIdx === -1) { console.log('Marker not found in', filePath); return; }

    // Walk forward and match opening/closing divs to find the closing tag
    let depth = 0;
    let i = startIdx;
    let closeIdx = -1;
    while (i < content.length) {
        const sub = content.slice(i);
        if (sub.startsWith('<div')) { depth++; i += 4; }
        else if (sub.startsWith('</div>')) {
            depth--;
            if (depth === 0) { closeIdx = i + 6; break; }
            i += 6;
        } else { i++; }
    }
    if (closeIdx === -1) { console.log('Could not find closing div in', filePath); return; }

    const before = content.slice(0, startIdx);
    const after = content.slice(closeIdx);

    let cardGrid;
    if (!isSubCompanies) {
        // Countries card grid
        cardGrid = [
            '{loading ? (',
            '  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">',
            '    {[1,2,3].map(i => (<div key={i} className="card p-5 animate-pulse"><div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div><div className="h-3 bg-gray-100 rounded w-full mb-2"></div></div>))}',
            '  </div>',
            ') : error ? (',
            '  <div className="p-8 text-center text-red-500">{error}</div>',
            ') : filteredCountries.length === 0 ? (',
            '  <div className="card p-16 text-center"><p className="font-bold text-gray-500">No countries found.</p></div>',
            ') : (',
            '  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">',
            '    {filteredCountries.map(country => {',
            '      const palette = ["from-purple-500 to-purple-700","from-blue-500 to-blue-700","from-teal-500 to-teal-700","from-pink-500 to-pink-700","from-orange-500 to-orange-700","from-indigo-500 to-indigo-700"];',
            '      const bg = palette[(country.name?.charCodeAt(0)||0) % palette.length];',
            '      return (',
            '        <div key={country.id} className={`card p-5 flex flex-col gap-3 border-2 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 ${country.is_active ? "border-black/10" : "border-red-200 bg-red-50/30"}`}>',
            '          <div className="flex items-start justify-between">',
            '            <div className="flex items-center gap-3">',
            '              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${bg} text-white flex items-center justify-center text-lg font-black border-2 border-black shadow-[2px_2px_0px_black] shrink-0`}>{country.name?.charAt(0).toUpperCase()}</div>',
            '              <div><h3 className="font-extrabold text-black text-sm">{country.name}</h3><p className="text-xs font-bold text-gray-500 mt-0.5">{country.code}</p></div>',
            '            </div>',
            '            <span className={`px-2.5 py-1 text-[10px] font-bold border rounded-full shrink-0 ${country.is_active ? "bg-green-100 text-green-700 border-green-300" : "bg-red-100 text-red-700 border-red-300"}`}>{country.is_active ? "Active" : "Inactive"}</span>',
            '          </div>',
            '          <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-2.5 border border-black/10">',
            '            <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Sub-Companies</span>',
            '            <span className="ml-auto text-xl font-black text-black">{country.sub_companies?.length || 0}</span>',
            '          </div>',
            '          <div className="flex items-center gap-2 pt-2 border-t-2 border-black/5">',
            '            <button onClick={() => openEditModal(country)} className="flex-1 text-xs font-bold py-1.5 rounded-lg border-2 border-blue-300 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all">Edit</button>',
            '            <button onClick={() => openDeleteModal(country)} className="flex-1 text-xs font-bold py-1.5 rounded-lg border-2 border-black text-black bg-white hover:bg-gray-100 transition-all shadow-[2px_2px_0px_black]">Delete</button>',
            '          </div>',
            '        </div>',
            '      );',
            '    })}',
            '  </div>',
            ')}'
        ].join('\n');
    } else {
        // SubCompanies card grid
        cardGrid = [
            '{loading ? (',
            '  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">',
            '    {[1,2,3].map(i => (<div key={i} className="card p-5 animate-pulse"><div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div><div className="h-3 bg-gray-100 rounded w-full mb-2"></div></div>))}',
            '  </div>',
            ') : error ? (',
            '  <div className="p-8 text-center text-red-500">{error}</div>',
            ') : filteredSubCompanies.length === 0 ? (',
            '  <div className="card p-16 text-center"><p className="font-bold text-gray-500">No sub-companies found.</p></div>',
            ') : (',
            '  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">',
            '    {filteredSubCompanies.map(subCompany => {',
            '      const palette = ["from-purple-500 to-purple-700","from-blue-500 to-blue-700","from-teal-500 to-teal-700","from-pink-500 to-pink-700","from-orange-500 to-orange-700","from-indigo-500 to-indigo-700"];',
            '      const bg = palette[(subCompany.name?.charCodeAt(0)||0) % palette.length];',
            '      return (',
            '        <div key={subCompany.id} className={`card p-5 flex flex-col gap-3 border-2 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 ${subCompany.is_active ? "border-black/10" : "border-red-200 bg-red-50/30"}`}>',
            '          <div className="flex items-start justify-between">',
            '            <div className="flex items-center gap-3">',
            '              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${bg} text-white flex items-center justify-center text-lg font-black border-2 border-black shadow-[2px_2px_0px_black] shrink-0`}>{subCompany.name?.charAt(0).toUpperCase()}</div>',
            '              <div><h3 className="font-extrabold text-black text-sm">{subCompany.name}</h3><p className="text-xs font-bold text-gray-500 mt-0.5">{subCompany.code}</p></div>',
            '            </div>',
            '            <span className={`px-2.5 py-1 text-[10px] font-bold border rounded-full shrink-0 ${subCompany.is_active ? "bg-green-100 text-green-700 border-green-300" : "bg-red-100 text-red-700 border-red-300"}`}>{subCompany.is_active ? "Active" : "Inactive"}</span>',
            '          </div>',
            '          <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-2.5 border border-black/10">',
            '            <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Country</span>',
            '            <span className="ml-auto text-xs font-black text-black">{subCompany.country?.name || "N/A"}</span>',
            '          </div>',
            '          <div className="flex items-center gap-2 pt-2 border-t-2 border-black/5">',
            '            <button onClick={() => openEditModal(subCompany)} className="flex-1 text-xs font-bold py-1.5 rounded-lg border-2 border-blue-300 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all">Edit</button>',
            '            <button onClick={() => openDeleteModal(subCompany)} className="flex-1 text-xs font-bold py-1.5 rounded-lg border-2 border-black text-black bg-white hover:bg-gray-100 transition-all shadow-[2px_2px_0px_black]">Delete</button>',
            '          </div>',
            '        </div>',
            '      );',
            '    })}',
            '  </div>',
            ')}'
        ].join('\n');
    }

    fs.writeFileSync(filePath, before + cardGrid + after, 'utf8');
    console.log('Done:', filePath);
}

replaceTableWithCards('e:\\HRMS\\HRMS_Project\\frontend-react\\src\\pages\\superadmin\\organization\\CountriesPage.js', false);
replaceTableWithCards('e:\\HRMS\\HRMS_Project\\frontend-react\\src\\pages\\superadmin\\organization\\SubCompaniesPage.js', true);
