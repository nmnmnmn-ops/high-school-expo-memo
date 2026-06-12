// データ構造
const QUESTIONS = [
    { id: 'dance', label: 'ダンス部の活動状況' },
    { id: 'events', label: '学校行事（運動会・文化祭）の力の入れ具合' },
    { id: 'commute', label: '通学について' },
    { id: 'facilities', label: '設備について' },
    { id: 'results', label: '進学実績' }
];

const MAX_SCHOOLS = 5;
const STORAGE_KEY = 'highSchoolMemoData';

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderSchools();
});

// データを取得
function getData() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// データを保存
function saveData(schools) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schools));
}

// 学校を追加
function addSchool() {
    const input = document.getElementById('schoolNameInput');
    const schoolName = input.value.trim();

    if (!schoolName) {
        alert('学校名を入力してください');
        return;
    }

    const schools = getData();
    if (schools.length >= MAX_SCHOOLS) {
        alert(`最大${MAX_SCHOOLS}校まで登録できます`);
        return;
    }

    const newSchool = {
        id: Date.now(),
        name: schoolName,
        answers: {},
        createdAt: new Date().toISOString()
    };

    QUESTIONS.forEach(q => {
        newSchool.answers[q.id] = '';
    });

    schools.push(newSchool);
    saveData(schools);
    input.value = '';
    renderSchools();
}

// 学校を削除
function deleteSchool(schoolId) {
    if (!confirm('この学校を削除しますか？')) return;

    const schools = getData().filter(s => s.id !== schoolId);
    saveData(schools);
    renderSchools();
}

// 学校をレンダリング
function renderSchools() {
    const schools = getData();
    const container = document.getElementById('schoolsList');

    if (schools.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>📍 学校がまだ登録されていません</p>
                <p>上の「新しい学校を追加」セクションで学校を追加してください</p>
            </div>
        `;
        return;
    }

    container.innerHTML = schools.map(school => `
        <div class="school-card">
            <div class="school-header">
                <div class="school-name">${escapeHtml(school.name)}</div>
                <div class="school-actions">
                    <button class="btn btn-small btn-edit" onclick="openEditModal(${school.id})">編集</button>
                    <button class="btn btn-small btn-delete" onclick="deleteSchool(${school.id})">削除</button>
                </div>
            </div>
            
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${getProgressPercentage(school)}%"></div>
            </div>
            <p style="font-size: 12px; color: #718096; margin: 5px 0 0 0;">
                ${getCompletedCount(school)}/${QUESTIONS.length} 回答済み
            </p>

            <div class="questions-container">
                ${QUESTIONS.map(q => `
                    <div class="question-item">
                        <div class="question-label">${escapeHtml(q.label)}</div>
                        <div class="answer-preview">
                            ${school.answers[q.id] ? escapeHtml(school.answers[q.id]) : '（未記入）'}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// 進捗率を計算
function getProgressPercentage(school) {
    const completed = getCompletedCount(school);
    return Math.round((completed / QUESTIONS.length) * 100);
}

// 回答済みの数をカウント
function getCompletedCount(school) {
    return QUESTIONS.filter(q => school.answers[q.id] && school.answers[q.id].trim()).length;
}

// 編集モーダルを開く
function openEditModal(schoolId) {
    const schools = getData();
    const school = schools.find(s => s.id === schoolId);

    if (!school) return;

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.innerHTML = `
        <div class="modal-header">✏️ ${escapeHtml(school.name)} - 回答編集</div>
        <div id="editForm"></div>
        <div class="modal-actions">
            <button class="btn btn-primary" onclick="saveEdits(${schoolId})">保存</button>
            <button class="btn btn-secondary" style="background: #cbd5e0; color: #2d3748;" onclick="closeModal()">キャンセル</button>
        </div>
    `;

    const formContainer = document.createElement('div');
    formContainer.innerHTML = QUESTIONS.map(q => `
        <div style="margin-bottom: 15px;">
            <label style="display: block; font-weight: 600; color: #667eea; margin-bottom: 5px; font-size: 14px;">
                Q: ${escapeHtml(q.label)}
            </label>
            <textarea 
                id="answer_${q.id}" 
                placeholder="回答を入力..."
                style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-family: inherit; min-height: 80px;"
            >${escapeHtml(school.answers[q.id] || '')}</textarea>
        </div>
    `).join('');

    modalContent.querySelector('#editForm').appendChild(formContainer);

    // モーダルを表示
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'editModal';
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };
    modal.appendChild(modalContent);

    document.body.appendChild(modal);
}

// 編集を保存
function saveEdits(schoolId) {
    const schools = getData();
    const school = schools.find(s => s.id === schoolId);

    if (!school) return;

    QUESTIONS.forEach(q => {
        const textarea = document.getElementById(`answer_${q.id}`);
        if (textarea) {
            school.answers[q.id] = textarea.value.trim();
        }
    });

    saveData(schools);
    closeModal();
    renderSchools();
    alert('保存しました！');
}

// モーダルを閉じる
function closeModal() {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.remove();
    }
}

// データをダウンロード（CSV）
function downloadData() {
    const schools = getData();

    if (schools.length === 0) {
        alert('ダウンロードするデータがありません');
        return;
    }

    let csv = '\ufeff'; // BOM（UTF-8 with BOM）
    csv += '学校名,';
    csv += QUESTIONS.map(q => `"${q.label}"`).join(',');
    csv += '\n';

    schools.forEach(school => {
        csv += `"${school.name}",`;
        csv += QUESTIONS.map(q => `"${(school.answers[q.id] || '').replace(/"/g, '""')}"`).join(',');
        csv += '\n';
    });

    // ダウンロード
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `高校受験メモ_${new Date().toLocaleDateString('ja-JP')}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// すべてのデータをリセット
function clearAllData() {
    if (!confirm('すべてのデータを削除してもよろしいですか？\nこの操作は取り消せません。')) {
        return;
    }

    if (!confirm('本当に削除しますか？')) {
        return;
    }

    localStorage.removeItem(STORAGE_KEY);
    renderSchools();
    alert('すべてのデータをリセットしました');
}

// データを読み込み（初期化用）
function loadData() {
    // LocalStorageからデータを読み込む
    const data = getData();
    // すでにsaveData/getDataで処理されている
}

// XSS対策：HTML特殊文字をエスケープ
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}