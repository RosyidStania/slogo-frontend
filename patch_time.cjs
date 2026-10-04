const fs = require('fs');
const filepath = 'src/pages/ManageEventTypes.jsx';
let content = fs.readFileSync(filepath, 'utf8');

// 1. Add import CustomSelect
if (!content.includes("import CustomSelect")) {
    content = content.replace(
        "import api from '../api/axios';",
        "import api from '../api/axios';\nimport CustomSelect from '../components/CustomSelect';"
    );
}

// 2. Add TIME_OPTIONS right after KATEGORI_LIST or top of file
const timeOptionsDecl = `\nconst TIME_OPTIONS = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    const hh = h.toString().padStart(2, '0');
    const mm = m.toString().padStart(2, '0');
    TIME_OPTIONS.push({ value: \`\${hh}:\${mm}\`, label: \`\${hh}:\${mm} WIB\` });
  }
}\n`;

if (!content.includes("TIME_OPTIONS")) {
    content = content.replace(
        "const kategoriList = [",
        timeOptionsDecl + "const kategoriList = ["
    );
}

// 3. Replace <input type="time" ... /> with <CustomSelect />
const oldInput = `<input
                    type="time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-800 cursor-pointer"
                  />`;
const newInput = `<CustomSelect
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    options={TIME_OPTIONS}
                    placeholder="Pilih Jam..."
                    className="w-full"
                  />`;

// Using regex to match because line-endings can vary
const inputRegex = /<input\s*type="time"\s*name="start_time"\s*value=\{formData\.start_time\}\s*onChange=\{handleInputChange\}\s*required\s*className="[^"]*"\s*\/>/;

if (inputRegex.test(content)) {
    content = content.replace(inputRegex, newInput);
    console.log("Successfully replaced input with CustomSelect.");
} else {
    console.log("Could not find input to replace.");
}

fs.writeFileSync(filepath, content, 'utf8');
