// データ構造
const STUDENT_QUESTIONS = [
    { id: 'fav', label: 'この学校の一番好きなところは何ですか？' },
    { id: 'diff', label: '入学前のイメージと違ったことはありますか？' },
    { id: 'dance', label: 'ダンス部ってどんな感じですか？' },
    { id: 'events', label: '文化祭や体育祭は本当に盛り上がりますか？それぞれ教えてください' },
    { id: 'students', label: 'この学校の生徒ってどんな人が多いですか？' }
];

const TEACHER_QUESTIONS = [
    { id: 'growing', label: 'この学校で伸びる生徒はどんなタイプですか？' },
    { id: 'struggle', label: '入学後に苦労する生徒はどんなタイプですか？' },
    { id: 'both', label: 'ダンスなど部活と勉強の両立はできますか？（入学後の勉強量はどんな感じですか？）' },
    { id: 'recommend', label: '指定校推薦は、どんな生徒が利用することが多いですか？' },
    { id: 'parent', label: '保護者から見て、この学校を選んで良かったと言われる点は何ですか？' }
];

const RATING_ITEMS = [
    { id: 'desire', label: '通いたい度' },
    { id: 'atmosphere', label: '生徒の雰囲気' },
    { id: 'dance_club', label: 'ダンス部' },
    { id: 'festival', label: '文化祭' },
    { id: 'commute', label: '通学' }
];

const MAX_SCHOOLS = 10;
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
        studentAnswers: {},
        teacherAnswers: {},
        ratings: {},
        createdAt: new Date().toISOString()
    };

    STUDENT_QUESTIONS.forEach(q => {
        newSchool.studentAnswers[q.id] = '';
    });

    TEACHER_QUESTIONS.forEach(q => {
        newSchool.teacherAnswers[q.id] = '';
    });

    RATING_ITEMS.forEach(r => {
        newSchool.ratings[r.id] = 0;
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
            <p style="font-size: 12px; color: #718096; margin: 5px 0 10px 0;">
                完成度: ${getProgressPercentage(school)}%
            </p>

            <!-- 評価セクション -->
            <div class="ratings-section">
                <h4 style="font-size: 13px; color: #667eea; margin-bottom: 10px; font-weight: 600;">⭐ 評価</h4>
                <div class="ratings-grid">
                    ${RATING_ITEMS.map(r => `
                        <div class="rating-item">
                            <div class="rating-label">${escapeHtml(r.label)}</div>
                            <div class="rating-stars" onclick="cycleRating(${school.id}, '${r.id}')">
                                ${renderStars(school.ratings[r.id])}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

// 星をレンダリング
function renderStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += i <= rating ? '⭐' : '☆';
    }
    return stars;
}

// 評価を切り替え
function cycleRating(schoolId, ratingId) {
    const schools = getData();
    const school = schools.find(s => s.id === schoolId);
    if (school) {
        school.ratings[ratingId] = (school.ratings[ratingId] % 5) + 1;
        saveData(schools);
        renderSchools();
    }
}

// 進捗率を計算
function getProgressPercentage(school) {
    const studentAnswered = STUDENT_QUESTIONS.filter(q => school.studentAnswers[q.id] && school.studentAnswers[q.id].trim()).length;
    const teacherAnswered = TEACHER_QUESTIONS.filter(q => school.teacherAnswers[q.id] && school.teacherAnswers[q.id].trim()).length;
    const totalQuestions = STUDENT_QUESTIONS.length + TEACHER_QUESTIONS.length;
    const answered = studentAnswered + teacherAnswered;
    return Math.round((answered / totalQuestions) * 100);
}

// 編集モーダルを開く
function openEditModal(schoolId) {
    const schools = getData();
    const school = schools.find(s => s.id === schoolId);

    if (!school) return;

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    let html = '<div class="modal-header">✏️ ' + escapeHtml(school.name) + ' - 回答編集</div>';
    html += '<div class="modal-tabs">';
    html += '<button class="tab-button active" onclick="switchTab(event, \'student\')">👥 在校生への質問</button>';
    html += '<button class="tab-button" onclick="switchTab(event, \'teacher\')">👨‍🏫 先生への質問</button>';
    html += '</div>';
    
    // 在校生への質問
    html += '<div class="tab-content active" id="student-tab">';
    html += STUDENT_QUESTIONS.map(q => `
        <div style="margin-bottom: 20px;">
            <label style="display: block; font-weight: 600; color: #667eea; margin-bottom: 5px; font-size: 14px;">
                Q: ${escapeHtml(q.label)}
            </label>
            <textarea 
                id="student_${q.id}" 
                placeholder="回答を入力..."
                style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-family: inherit; min-height: 80px;"
            >${escapeHtml(school.studentAnswers[q.id] || '')}</textarea>
        </div>
    `).join('');
    html += '</div>';

    // 先生への質問
    html += '<div class="tab-content" id="teacher-tab">';
    html += TEACHER_QUESTIONS.map(q => `
        <div style="margin-bottom: 20px;">
            <label style="display: block; font-weight: 600; color: #667eea; margin-bottom: 5px; font-size: 14px;">
                Q: ${escapeHtml(q.label)}
            </label>
            <textarea 
                id="teacher_${q.id}" 
                placeholder="回答を入力..."
                style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-family: inherit; min-height: 80px;"
            >${escapeHtml(school.teacherAnswers[q.id] || '')}</textarea>
        </div>
    `).join('');
    html += '</div>';

    html += '<div class="modal-actions">';
    html += '<button class="btn btn-primary" onclick="saveEdits(' + schoolId + ')">保存</button>';
    html += '<button class="btn btn-secondary" style="background: #cbd5e0; color: #2d3748;" onclick="closeModal()">キャンセル</button>';
    html += '</div>';

    modalContent.innerHTML = html;

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

// タブを切り替え
function switchTab(event, tabName) {
    // すべてのタブを非表示
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });

    // 選択されたタブを表示
    document.getElementById(tabName + '-tab').classList.add('active');
    event.target.classList.add('active');
}

// 編集を保存
function saveEdits(schoolId) {
    const schools = getData();
    const school = schools.find(s => s.id === schoolId);

    if (!school) return;

    STUDENT_QUESTIONS.forEach(q => {
        const textarea = document.getElementById('student_' + q.id);
        if (textarea) {
            school.studentAnswers[q.id] = textarea.value.trim();
        }
    });

    TEACHER_QUESTIONS.forEach(q => {
        const textarea = document.getElementById('teacher_' + q.id);
        if (textarea) {
            school.teacherAnswers[q.id] = textarea.value.trim();
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
    
    // ヘッダー
    csv += '学校名,';
    csv += STUDENT_QUESTIONS.map(q => '"' + q.label + '"').join(',') + ',';
    csv += TEACHER_QUESTIONS.map(q => '"' + q.label + '"').join(',') + ',';
    csv += RATING_ITEMS.map(r => '"' + r.label + '（評価）"').join(',');
    csv += '\n';

    // データ行
    schools.forEach(school => {
        csv += '"' + school.name + '",';
        csv += STUDENT_QUESTIONS.map(q => '"' + (school.studentAnswers[q.id] || '').replace(/"/g, '""') + '"').join(',') + ',';
        csv += TEACHER_QUESTIONS.map(q => '"' + (school.teacherAnswers[q.id] || '').replace(/"/g, '""') + '"').join(',') + ',';
        csv += RATING_ITEMS.map(r => '"' + (school.ratings[r.id] || 0) + '"').join(',');
        csv += '\n';
    });

    // ダウンロード
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', '高校受験メモ_' + new Date().toLocaleDateString('ja-JP') + '.csv');
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
