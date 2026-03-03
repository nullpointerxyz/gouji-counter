const CONFIG = {
    '4': {
        eagle: 0,
        bigJoker: 4,
        smallJoker: 4,
        two: 16
    },
    '6': {
        eagle: 0,
        bigJoker: 6,
        smallJoker: 6,
        two: 24
    },
    '6e': {
        eagle: 6, // 鹰的数量等于牌的副数
        bigJoker: 6,
        smallJoker: 6,
        two: 24
    }
};

const CARD_INFOS = [
    { id: 'eagle', name: '大鹰', icon: '🦅' },
    { id: 'bigJoker', name: '大王', icon: '🃏' },
    { id: 'smallJoker', name: '小王', icon: '🃟' },
    { id: 'two', name: ' 2 ', icon: '✌️' }
];

let currentMode = '6e';
let state = {};

const cardsContainer = document.getElementById('cardsContainer');
const gameModeSelect = document.getElementById('gameMode');
const btnReset = document.getElementById('btnReset');

// 初始化/重置状态
function initState() {
    const config = CONFIG[currentMode];
    state = {};
    CARD_INFOS.forEach(info => {
        state[info.id] = {
            total: config[info.id],
            remaining: config[info.id],
            history: [] // 用于撤销
        };
    });
}

// 播放动画
function triggerAnimation(cardId) {
    const el = document.getElementById(`card-${cardId.replace(/([A-Z])/g, "-$1").toLowerCase()}`);
    if (el) {
        el.classList.remove('pop');
        void el.offsetWidth; // trigger reflow
        el.classList.add('pop');
        setTimeout(() => el.classList.remove('pop'), 200);
    }
}

// 渲染UI
function render() {
    cardsContainer.innerHTML = '';

    CARD_INFOS.forEach(info => {
        const cardState = state[info.id];
        if (cardState.total === 0) return; // 当前模式没有的牌不显示

        const cardEl = document.createElement('div');
        cardEl.className = 'card-item';
        const cssId = info.id.replace(/([A-Z])/g, "-$1").toLowerCase();
        cardEl.id = `card-${cssId}`;

        // 计算颜色状态
        let statusClass = 'status-safe';
        const ratio = cardState.remaining / cardState.total;
        if (cardState.remaining === 0) {
            statusClass = 'status-danger';
        } else if (ratio <= 0.3) {
            statusClass = 'status-warning';
        }

        // 渲染快捷操作按钮
        let actionsHtml = '';
        let maxOut = 4;
        if (info.id === 'two') {
            maxOut = 8;
        } else if (info.id === 'eagle') {
            maxOut = Math.min(cardState.total, 6);
        }

        for (let i = 1; i <= maxOut; i++) {
            const isDisabled = cardState.remaining < i;
            actionsHtml += `
                <button class="btn btn-action" onclick="playCard('${info.id}', ${i})" ${isDisabled ? 'disabled' : ''}>
                    出${i}<span>张</span>
                </button>
            `;
        }

        // 填充卡片HTML
        cardEl.innerHTML = `
            <div class="card-header">
                <div class="card-title">
                    <span class="icon">${info.icon}</span>
                    <span>${info.name}</span>
                </div>
                <div class="card-count-wrapper">
                    <div class="card-count ${statusClass}">${cardState.remaining}</div>
                    <div class="card-total">/ ${cardState.total}</div>
                </div>
            </div>
            <div class="actions">
                ${actionsHtml}
            </div>
            <button class="btn btn-undo" onclick="undo('${info.id}')" ${cardState.history.length === 0 ? 'disabled' : ''}>
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;">
                    <path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
                </svg>
                撤回上一步
            </button>
        `;

        cardsContainer.appendChild(cardEl);
    });
}

// 出牌逻辑
window.playCard = function (id, count) {
    if (state[id].remaining >= count) {
        state[id].remaining -= count;
        state[id].history.push(count); // 记录出牌数量支持撤销

        // 手机端震动反馈 (支持的设备)
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }

        render();
        triggerAnimation(id);
    }
};

// 撤销逻辑
window.undo = function (id) {
    if (state[id].history.length > 0) {
        const lastCount = state[id].history.pop();
        state[id].remaining += lastCount;

        if (navigator.vibrate) {
            navigator.vibrate([30, 30, 30]); // 特殊震动表示撤销
        }

        render();
        triggerAnimation(id);
    }
};

// 模式切换
gameModeSelect.addEventListener('change', (e) => {
    // 防止误触导致数据丢失，如果有历史记录则提醒
    const hasHistory = Object.values(state).some(s => s.history.length > 0);
    if (hasHistory && !confirm('切换模式将清空当前的记牌进度，是否继续？')) {
        e.target.value = currentMode; // 恢复选项
        return;
    }

    currentMode = e.target.value;
    initState();
    render();
});

// 重置按钮
btnReset.addEventListener('click', () => {
    // 防止手滑点错，使用原生弹窗确认
    if (confirm('确定要清空所有记录，重新开始吗？')) {
        initState();
        render();
        if (navigator.vibrate) {
            navigator.vibrate([100]); // 强震动
        }
    }
});

// 让 Select 控件与当前默认模式同步
gameModeSelect.value = currentMode;

// 启动应用
initState();
render();
