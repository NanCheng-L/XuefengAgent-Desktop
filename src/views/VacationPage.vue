<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import * as XLSX from 'xlsx';
import { save as saveDialog, open as openFileDialog } from '@tauri-apps/plugin-dialog';
import { writeFile as tauriWriteFile, readFile as tauriReadFile } from '@tauri-apps/plugin-fs';
import MajorSelect from '../components/MajorSelect.vue';

// 初始化主题
const savedTheme = localStorage.getItem('xf_theme');
if (savedTheme === 'dark') {
  document.documentElement.dataset.theme = 'dark';
} else {
  delete document.documentElement.dataset.theme;
}

function onStorage(e: StorageEvent) {
  if (e.key === 'xf_theme' && e.newValue) {
    if (e.newValue === 'dark') {
      document.documentElement.dataset.theme = 'dark';
    } else {
      delete document.documentElement.dataset.theme;
    }
  }
}

onMounted(() => {
  load();
  window.addEventListener('storage', onStorage);
});

onUnmounted(() => {
  window.removeEventListener('storage', onStorage);
});

const STORAGE_KEY = 'xf_vacation_data';
const DEFAULT_COUNT = 48;

interface VacationRow {
  schoolCode: string;
  schoolName: string;
  groupCode: string;
  majorCode1: string; majorName1: string;
  majorCode2: string; majorName2: string;
  majorCode3: string; majorName3: string;
  majorCode4: string; majorName4: string;
  majorCode5: string; majorName5: string;
  majorCode6: string; majorName6: string;
  majorObedience: string;
}

function createEmptyRow(): VacationRow {
  return {
    schoolCode: '', schoolName: '', groupCode: '',
    majorCode1: '', majorName1: '',
    majorCode2: '', majorName2: '',
    majorCode3: '', majorName3: '',
    majorCode4: '', majorName4: '',
    majorCode5: '', majorName5: '',
    majorCode6: '', majorName6: '',
    majorObedience: '',
  };
}

function createDefaultRows(): VacationRow[] {
  return Array.from({ length: DEFAULT_COUNT }, () => createEmptyRow());
}

const rows = ref<VacationRow[]>(createDefaultRows());

function load() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      if (Array.isArray(data) && data.length > 0) {
        rows.value = data;
      }
    }
  } catch {}
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.value));
  } catch {}
}

function restoreDefault() {
  rows.value = createDefaultRows();
  save();
}

function addRow() {
  rows.value.push(createEmptyRow());
  save();
}

function removeRow() {
  if (rows.value.length > 1) {
    rows.value.pop();
    save();
  }
}

function onCellChange() {
  save();
}

async function exportExcel() {
  const header = [
    '志愿序号', '院校代码', '院校名称', '专业组代码',
    '专业代码1', '专业名称1', '专业代码2', '专业名称2',
    '专业代码3', '专业名称3', '专业代码4', '专业名称4',
    '专业代码5', '专业名称5', '专业代码6', '专业名称6',
    '专业服从',
  ];
  const data: (string | number)[][] = [header];
  rows.value.forEach((row, i) => {
    data.push([
      i + 1,
      row.schoolCode, row.schoolName, row.groupCode,
      row.majorCode1, row.majorName1, row.majorCode2, row.majorName2,
      row.majorCode3, row.majorName3, row.majorCode4, row.majorName4,
      row.majorCode5, row.majorName5, row.majorCode6, row.majorName6,
      row.majorObedience,
    ]);
  });
  data.push([]);
  data.push(['注：志愿预填表各类批次排序不分先后，正式录取投档规则按相关文件执行。']);

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 10 }, { wch: 12 }, { wch: 24 }, { wch: 12 },
    { wch: 10 }, { wch: 20 }, { wch: 10 }, { wch: 20 },
    { wch: 10 }, { wch: 20 }, { wch: 10 }, { wch: 20 },
    { wch: 10 }, { wch: 20 }, { wch: 10 }, { wch: 20 },
    { wch: 10 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '志愿预填表');
  const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

  const filePath = await saveDialog({
    defaultPath: '志愿预填表.xlsx',
    filters: [{ name: 'Excel', extensions: ['xlsx'] }],
  });
  if (filePath) {
    await tauriWriteFile(filePath, new Uint8Array(wbOut));
  }
}

async function importExcel() {
  const file = await openFileDialog({
    multiple: false,
    filters: [{ name: 'Excel', extensions: ['xlsx', 'xls'] }],
  });
  if (!file) return;

  const buffer = await tauriReadFile(file as string);
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
  if (data.length < 2) return;

  const newRows: VacationRow[] = [];
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    if (!r || r.length === 0 || (r[0] && isNaN(Number(r[0])))) continue;
    newRows.push({
      schoolCode: r[1] || '',
      schoolName: r[2] || '',
      groupCode: r[3] || '',
      majorCode1: r[4] || '', majorName1: r[5] || '',
      majorCode2: r[6] || '', majorName2: r[7] || '',
      majorCode3: r[8] || '', majorName3: r[9] || '',
      majorCode4: r[10] || '', majorName4: r[11] || '',
      majorCode5: r[12] || '', majorName5: r[13] || '',
      majorCode6: r[14] || '', majorName6: r[15] || '',
      majorObedience: r[16] || '',
    });
  }
  if (newRows.length > 0) {
    rows.value = newRows;
    save();
  }
}

</script>

<template>
  <div class="vacation-page">
    <div class="vacation-toolbar">
      <span class="toolbar-title">志愿填报模拟</span>
      <span class="toolbar-count">{{ rows.length }} 个志愿</span>
      <div class="toolbar-actions">
        <button @click="restoreDefault">恢复默认</button>
        <button @click="addRow">+ 添加</button>
        <button @click="removeRow" :disabled="rows.length <= 1">- 减少</button>
        <button @click="importExcel">导入 Excel</button>
        <button class="btn-primary" @click="exportExcel">导出 Excel</button>
      </div>
    </div>

    <div class="vacation-table-wrap">
      <table class="vacation-table">
        <thead>
          <tr>
            <th class="th-index" rowspan="2">序号</th>
            <th class="th-school" colspan="3">院校和专业组</th>
            <th class="th-major" colspan="6">专业</th>
            <th class="th-obey" rowspan="2">是否调剂</th>
          </tr>
          <tr>
            <th class="th-sub">院校代号</th>
            <th class="th-sub">名称</th>
            <th class="th-sub">专业组号</th>
            <th class="th-sub">专业1代号</th>
            <th class="th-sub">名称</th>
            <th class="th-sub">专业3代号</th>
            <th class="th-sub">名称</th>
            <th class="th-sub">专业5代号</th>
            <th class="th-sub">名称</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(row, i) in rows" :key="i">
            <!-- 第一行：院校代号+名称 | 专业1/3/5 -->
            <tr>
              <td class="td-index" rowspan="2">{{ i + 1 }}</td>
              <td class="td-label-cell"><div class="cell-inner"><span class="td-label">院校代号：</span><input v-model="row.schoolCode" @change="onCellChange"></div></td>
              <td class="td-label-cell td-name" colspan="2"><div class="cell-inner"><span class="td-label">名称：</span><input v-model="row.schoolName" @change="onCellChange"></div></td>
              <td class="td-label-cell"><div class="cell-inner"><span class="td-label">专业1代号：</span><MajorSelect :code="row.majorCode1" :name="row.majorName1" @update:code="row.majorCode1 = $event; onCellChange()" @update:name="row.majorName1 = $event; onCellChange()"></MajorSelect></div></td>
              <td class="td-label-cell td-name"><div class="cell-inner"><span class="td-label">名称：</span><input :value="row.majorName1" @input="row.majorName1 = ($event.target as HTMLInputElement).value; onCellChange()" ></div></td>
              <td class="td-label-cell"><div class="cell-inner"><span class="td-label">专业3代号：</span><MajorSelect :code="row.majorCode3" :name="row.majorName3" @update:code="row.majorCode3 = $event; onCellChange()" @update:name="row.majorName3 = $event; onCellChange()"></MajorSelect></div></td>
              <td class="td-label-cell td-name"><div class="cell-inner"><span class="td-label">名称：</span><input :value="row.majorName3" @input="row.majorName3 = ($event.target as HTMLInputElement).value; onCellChange()" ></div></td>
              <td class="td-label-cell"><div class="cell-inner"><span class="td-label">专业5代号：</span><MajorSelect :code="row.majorCode5" :name="row.majorName5" @update:code="row.majorCode5 = $event; onCellChange()" @update:name="row.majorName5 = $event; onCellChange()"></MajorSelect></div></td>
              <td class="td-label-cell td-name"><div class="cell-inner"><span class="td-label">名称：</span><input :value="row.majorName5" @input="row.majorName5 = ($event.target as HTMLInputElement).value; onCellChange()" ></div></td>
              <td class="td-obey" rowspan="2">
                <label class="obey-option"><input type="radio" :name="'obey' + i" value="是" v-model="row.majorObedience" @change="onCellChange"> 是</label>
                <label class="obey-option"><input type="radio" :name="'obey' + i" value="否" v-model="row.majorObedience" @change="onCellChange"> 否</label>
              </td>
            </tr>
            <!-- 第二行：专业组号 | 专业2/4/6 -->
            <tr>
              <td class="td-label-cell td-group" colspan="3"><div class="cell-inner"><span class="td-label">专业组号：</span><input v-model="row.groupCode" @change="onCellChange"></div></td>
              <td class="td-label-cell"><div class="cell-inner"><span class="td-label">专业2代号：</span><MajorSelect :code="row.majorCode2" :name="row.majorName2" @update:code="row.majorCode2 = $event; onCellChange()" @update:name="row.majorName2 = $event; onCellChange()"></MajorSelect></div></td>
              <td class="td-label-cell td-name"><div class="cell-inner"><span class="td-label">名称：</span><input :value="row.majorName2" @input="row.majorName2 = ($event.target as HTMLInputElement).value; onCellChange()" ></div></td>
              <td class="td-label-cell"><div class="cell-inner"><span class="td-label">专业4代号：</span><MajorSelect :code="row.majorCode4" :name="row.majorName4" @update:code="row.majorCode4 = $event; onCellChange()" @update:name="row.majorName4 = $event; onCellChange()"></MajorSelect></div></td>
              <td class="td-label-cell td-name"><div class="cell-inner"><span class="td-label">名称：</span><input :value="row.majorName4" @input="row.majorName4 = ($event.target as HTMLInputElement).value; onCellChange()" ></div></td>
              <td class="td-label-cell"><div class="cell-inner"><span class="td-label">专业6代号：</span><MajorSelect :code="row.majorCode6" :name="row.majorName6" @update:code="row.majorCode6 = $event; onCellChange()" @update:name="row.majorName6 = $event; onCellChange()"></MajorSelect></div></td>
              <td class="td-label-cell td-name"><div class="cell-inner"><span class="td-label">名称：</span><input :value="row.majorName6" @input="row.majorName6 = ($event.target as HTMLInputElement).value; onCellChange()" ></div></td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font: 12px/1.5 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: var(--bg);
  color: var(--text);
}

.vacation-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.vacation-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  flex-shrink: 0;
}

.toolbar-title {
  font-size: 15px;
  font-weight: 700;
  margin-right: auto;
}

.toolbar-count {
  font-size: 12px;
  color: var(--text-muted);
  margin-right: 8px;
}

.toolbar-actions {
  display: flex;
  gap: 6px;
}

.toolbar-actions button {
  padding: 5px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--card);
  cursor: pointer;
  font-size: 12px;
  color: var(--text);
  transition: all 0.2s;
  white-space: nowrap;
}

.toolbar-actions button:hover:not(:disabled) {
  border-color: var(--primary);
}

.toolbar-actions button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toolbar-actions .btn-primary {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

.toolbar-actions .btn-primary:hover {
  opacity: 0.9;
}

.vacation-table-wrap {
  flex: 1;
  overflow: auto;
  padding: 0;
}

.vacation-table-wrap::-webkit-scrollbar { width: 6px; height: 6px; }
.vacation-table-wrap::-webkit-scrollbar-track { background: var(--bg); }
.vacation-table-wrap::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
.vacation-table-wrap::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

.vacation-table {
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 12px;
}

.vacation-table th {
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 6px 10px;
  font-weight: 600;
  white-space: nowrap;
  text-align: center;
  font-size: 13px;
  position: sticky;
  z-index: 2;
}

.vacation-table thead tr:first-child th {
  top: 0;
  z-index: 4;
}

.vacation-table thead tr:nth-child(2) th {
  top: 33px;
  z-index: 3;
}

.vacation-table th.th-sub {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary);
  padding: 4px 6px;
}

.vacation-table td {
  border: 1px solid var(--border);
  padding: 0;
  height: 28px;
  overflow: hidden;
}

.vacation-table td.td-index {
  text-align: center;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--surface);
  min-width: 36px;
  font-size: 13px;
}

.vacation-table thead th.th-index {
  min-width: 36px;
}

.vacation-table td.td-label-cell {
  padding: 0;
}

.vacation-table .cell-inner {
  display: flex;
  align-items: center;
  height: 100%;
}

.vacation-table .td-label {
  color: var(--text-muted);
  font-size: 11px;
  padding-left: 4px;
  pointer-events: none;
  white-space: nowrap;
  flex-shrink: 0;
}

.vacation-table .td-name {
  max-width: 280px;
}

.vacation-table input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  padding: 4px 4px 4px 0;
  font: inherit;
  background: transparent;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vacation-table input:focus {
  background: rgba(217, 122, 60, 0.06);
}

.vacation-table .td-group {
  min-width: 180px;
}

.vacation-table td.td-obey {
  text-align: center;
  vertical-align: middle;
  background: var(--surface);
  min-width: 64px;
}

.vacation-table .obey-option {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  cursor: pointer;
  padding: 0 4px;
}

.vacation-table .obey-option input[type="radio"] {
  width: auto;
  min-width: 0;
  accent-color: var(--primary);
}

.vacation-table tbody tr:nth-child(4n+1),
.vacation-table tbody tr:nth-child(4n+2) {
  background: var(--surface);
}

.vacation-table tbody tr:nth-child(4n+3),
.vacation-table tbody tr:nth-child(4n+4) {
  background: var(--bg);
}

:root[data-theme="dark"] .vacation-table tbody tr:nth-child(4n+3),
:root[data-theme="dark"] .vacation-table tbody tr:nth-child(4n+4) {
  background: rgba(255, 255, 255, 0.02);
}

.vacation-table tbody tr:hover input:focus {
  background: rgba(217, 122, 60, 0.06);
}

:root[data-theme="dark"] .vacation-table input:focus {
  background: rgba(16, 185, 129, 0.08);
}
</style>
