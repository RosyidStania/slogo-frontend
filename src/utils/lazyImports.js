export async function loadXlsx() {
  const mod = await import('xlsx');
  return mod.utils ? mod : mod.default;
}

export async function loadExcelJsAndSaver() {
  const [excelMod, fsMod] = await Promise.all([
    import('exceljs'),
    import('file-saver'),
  ]);
  const ExcelJS = excelMod.default ?? excelMod;
  const saveAs = fsMod.saveAs ?? fsMod.default?.saveAs ?? fsMod.default;
  return { ExcelJS, saveAs };
}

export async function loadHtmlToImage() {
  return import('html-to-image');
}

export async function loadZipExportTools() {
  const [{ toPng }, jszipMod, fsMod] = await Promise.all([
    import('html-to-image'),
    import('jszip'),
    import('file-saver'),
  ]);
  const JSZip = jszipMod.default ?? jszipMod;
  const saveAs = fsMod.saveAs ?? fsMod.default?.saveAs ?? fsMod.default;
  return { toPng, JSZip, saveAs };
}
