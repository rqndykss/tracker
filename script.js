// Добавить константы в начало файла
const STRATZ_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJTdWJqZWN0IjoiMmNmMjJkZDMtYzllMy00OGZlLTgxYjctMTE3NTI2Y2EzOGRjIiwiU3RlYW1JZCI6IjQzMDc0NzkzNCIsIkFQSVVzZXIiOiJ0cnVlIiwibmJmIjoxNzU2NjYwNTgyLCJleHAiOjE3ODgxOTY1ODIsImlhdCI6MTc1NjY2MDU4MiwiaXNzIjoiaHR0cHM6Ly9hcGkuc3RyYXR6LmNvbSJ9.cHrFV6xcBrQJ-h8WS4bR4Jf9HVrT22a4kyKf6wOicTI';
const STRATZ_API_URL = 'https://api.stratz.com/graphql';
// Данные игрока
let playerData = {
    playerId: "",
    avatar: "https://via.placeholder.com/150/666/ffffff?text=Titan",
    mmr: 10060,
    maxMmr: 10060,
    minMmr: 10060,
    totalChanges: 0,
    games: [], // Добавляем массив для хранения игр
    history: ["Начальное значение: 10060 MMR"]
};

// Константы для расчета рейтинга
const TOP_1_MMR = 17500;   // MMR лучшего игрока в мире
const TOP_100_MMR = 12000; // MMR 100-го игрока
const BASE_PLAYERS = 5000; // Базовое количество Immortal игроков

// Константы для случайного MMR
const MMR_RANGES = {
    // Диапазоны MMR в зависимости от уверенности системы
    CALIBRATION: { min: 60, max: 150 },   // Калибровочные игры
    UNCERTAIN: { min: 30, max: 50 },      // Высокая неопределенность
    NORMAL: { min: 20, max: 35 }          // Обычные игры
};

// Загрузка данных при запуске
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    updateDisplay();
    updateMmrChangePreview();
});

// Расчет мирового рейтинга на основе MMR
function calculateWorldRank(mmr) {
    if (mmr < 5630) return "Not Immortal"; // Ниже Immortal
    
    // Экспоненциальная формула для расчета рейтинга
    // Чем выше MMR, тем ниже (лучше) ранг
    const scale = Math.log(TOP_1_MMR - 5600) / Math.log(TOP_100_MMR - 5600);
    let rank = Math.floor(BASE_PLAYERS * Math.pow((TOP_1_MMR - mmr) / (TOP_1_MMR - 5600), scale));
    
    // Гарантируем, что ранг не меньше 1
    rank = Math.max(1, rank);
    
    return rank;
}

// Форматирование ранга с правильным окончанием
function formatRank(rank) {
    if (rank === 1) return "1st";
    if (rank === 2) return "2nd";
    if (rank === 3) return "3rd";
    return rank + "th";
}

// Получение случайного изменения MMR на основе текущего состояния
function getRandomMmrChange() {
    const gamesCount = playerData.games.length;
    
    let range;
    if (gamesCount < 10) {
        // Калибровочные игры (первые 10 игр)
        range = MMR_RANGES.CALIBRATION;
    } else if (gamesCount < 30) {
        // Высокая неопределенность
        range = MMR_RANGES.UNCERTAIN;
    } else {
        // Обычные игры
        range = MMR_RANGES.NORMAL;
    }
    
    // Случайное значение в диапазоне
    const change = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    
    // Небольшой шанс на экстремальные значения (±5%)
    if (Math.random() < 0.05) {
        return Math.random() < 0.5 ? change + 10 : change - 5;
    }
    
    return change;
}

// Обновление предпросмотра изменения MMR
function updateMmrChangePreview() {
    const winChange = getRandomMmrChange();
    const lossChange = -getRandomMmrChange();
    
    document.getElementById('win-mmr-preview').textContent = `+${winChange}`;
    document.getElementById('loss-mmr-preview').textContent = `${lossChange}`;
    
    // Также обновляем кнопки
    const winButton = document.getElementById('win-button-mmr');
    const lossButton = document.getElementById('loss-button-mmr');
    if (winButton) winButton.textContent = `+${winChange}`;
    if (lossButton) lossButton.textContent = `${lossChange}`;
}

// Загрузка аватара
function uploadAvatar() {
    const input = document.getElementById('avatar-upload');
    input.click();
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const avatar = document.getElementById('avatar');
                avatar.src = event.target.result;
                playerData.avatar = event.target.result;
                saveToLocalStorage();
            };
            reader.readAsDataURL(file);
        }
    };
}

// Изменение MMR
function changeMMR(delta) {
    const oldMmr = playerData.mmr;
    playerData.mmr += delta;
    
    // Обновление статистики
    playerData.totalChanges++;
    playerData.maxMmr = Math.max(playerData.maxMmr, playerData.mmr);
    playerData.minMmr = Math.min(playerData.minMmr, playerData.mmr);
    
    // Добавление в историю
    const changeType = delta > 0 ? '📈 +' : '📉 ';
    const timestamp = new Date().toLocaleTimeString();
    const oldRank = calculateWorldRank(oldMmr);
    const newRank = calculateWorldRank(playerData.mmr);
    
    let rankChange = "";
    if (oldRank !== "Not Immortal" && newRank !== "Not Immortal") {
        const rankDiff = oldRank - newRank;
        if (rankDiff > 0) {
            rankChange = ` (▲ ${rankDiff})`;
        } else if (rankDiff < 0) {
            rankChange = ` (▼ ${Math.abs(rankDiff)})`;
        }
    }
    
    playerData.history.unshift(`${changeType}${delta} MMR | ${playerData.mmr} MMR | ${formatRank(newRank)}${rankChange} | ${timestamp}`);
    
    // Ограничение истории
    if (playerData.history.length > 10) {
        playerData.history.pop();
    }
    
    updateDisplay();
    saveToLocalStorage();
}

// Добавление игры
function addGame(result) {
    const heroName = document.getElementById('hero-name').value || 'Unknown Hero';
    const duration = parseInt(document.getElementById('game-duration').value) || 40;
    
    // Получаем случайное изменение MMR
    let mmrChange = getRandomMmrChange();
    
    // Для поражения MMR должно быть отрицательным
    if (result === 'loss') {
        mmrChange = -mmrChange;
    }
    
    // Создаем объект игры
    const game = {
        id: Date.now(), // Уникальный ID
        date: new Date().toISOString(),
        hero: heroName,
        duration: duration,
        result: result,
        mmrChange: mmrChange,
        mmrAfter: playerData.mmr + mmrChange
    };
    
    // Добавляем игру в массив
    playerData.games.unshift(game);
    
    // Обновляем MMR
    changeMMR(mmrChange);
    
    // Очищаем поле героя для следующей игры
    document.getElementById('hero-name').value = '';
    
    // Обновляем предпросмотр для следующей игры
    updateMmrChangePreview();
    
    // Показываем уведомление
    showNotification(result === 'win' ? 
        `✅ Победа! +${Math.abs(mmrChange)} MMR` : 
        `❌ Поражение! -${Math.abs(mmrChange)} MMR`);
}

// Показать уведомление
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(50, 50, 50, 0.9);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        border-left: 4px solid #888;
        z-index: 1000;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Ручная установка MMR
function setManualMMR() {
    const manualInput = document.getElementById('manual-mmr');
    const newMmr = parseInt(manualInput.value);
    
    if (!isNaN(newMmr) && newMmr >= 0) {
        const oldMmr = playerData.mmr;
        const delta = newMmr - playerData.mmr;
        if (delta !== 0) {
            playerData.mmr = newMmr;
            playerData.totalChanges++;
            playerData.maxMmr = Math.max(playerData.maxMmr, playerData.mmr);
            playerData.minMmr = Math.min(playerData.minMmr, playerData.mmr);
            
            const timestamp = new Date().toLocaleTimeString();
            const newRank = calculateWorldRank(playerData.mmr);
            playerData.history.unshift(`⚡ Установлено: ${playerData.mmr} MMR | ${formatRank(newRank)} | ${timestamp}`);
            
            if (playerData.history.length > 10) {
                playerData.history.pop();
            }
            
            updateDisplay();
            saveToLocalStorage();
        }
    }
}

// Сброс MMR
function resetMMR() {
    if (playerData.mmr !== 10060) {
        const oldMmr = playerData.mmr;
        playerData.mmr = 10060;
        playerData.totalChanges++;
        
        const timestamp = new Date().toLocaleTimeString();
        const newRank = calculateWorldRank(playerData.mmr);
        playerData.history.unshift(`🔄 Сброс на 10060 MMR | ${formatRank(newRank)} | ${timestamp}`);
        
        if (playerData.history.length > 10) {
            playerData.history.pop();
        }
        
        updateDisplay();
        saveToLocalStorage();
    }
}

// Обновление отображение
function updateDisplay() {
    const worldRank = calculateWorldRank(playerData.mmr);
    const rankText = worldRank === "Not Immortal" ? "Not Immortal" : `#${worldRank}`;
    const formattedRank = worldRank === "Not Immortal" ? "Not Immortal" : formatRank(worldRank);
    
    document.getElementById('current-mmr').textContent = playerData.mmr;
    document.getElementById('mmr-value').textContent = `${playerData.mmr} MMR`;
    document.getElementById('max-mmr').textContent = playerData.maxMmr;
    document.getElementById('min-mmr').textContent = playerData.minMmr;
    document.getElementById('total-changes').textContent = playerData.totalChanges;
    document.getElementById('rank-position').textContent = `World Rank: ${rankText}`;
    document.getElementById('rank-position-main').textContent = `World Rank: ${rankText}`;
    
    // Обновление прогрессбара Immortal
    updateImmortalProgress(playerData.mmr);
    
    // Обновление истории
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';
    playerData.history.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.textContent = item;
        historyList.appendChild(div);
    });
    
    // Обновление ID игрока если изменено
    const playerIdInput = document.getElementById('player-id');
    if (playerIdInput.value !== playerData.playerId) {
        playerIdInput.value = playerData.playerId;
    }
}

// Обновление прогрессбара Immortal
function updateImmortalProgress(mmr) {
    const progressBar = document.getElementById('immortal-progress');
    if (mmr < 5630) {
        progressBar.style.width = '0%';
        document.getElementById('immortal-percent').textContent = '0%';
    } else {
        const progress = ((mmr - 5630) / (TOP_1_MMR - 5630)) * 100;
        progressBar.style.width = Math.min(100, progress) + '%';
        document.getElementById('immortal-percent').textContent = Math.min(100, Math.round(progress)) + '%';
    }
}

// Сохранение данных
function saveData() {
    playerData.playerId = document.getElementById('player-id').value;
    saveToLocalStorage();
    
    // Создание JSON для скачивания
    const dataStr = JSON.stringify(playerData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', 'dota2_titan_data.json');
    link.click();
    
    // Уведомление
    showNotification('Данные сохранены и экспортированы!');
}

// Экспорт данных
function exportData() {
    const dataStr = JSON.stringify(playerData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', 'dota2_titan_backup.json');
    link.click();
}

// Сохранение в localStorage
function saveToLocalStorage() {
    localStorage.setItem('dota2TitanData', JSON.stringify(playerData));
}

// Загрузка из localStorage
function loadData() {
    const savedData = localStorage.getItem('dota2TitanData');
    if (savedData) {
        const parsedData = JSON.parse(savedData);
        playerData = { ...playerData, ...parsedData };
        
        // Обновление аватара
        document.getElementById('avatar').src = playerData.avatar;
        document.getElementById('player-id').value = playerData.playerId;
    }
}

// Обработка ввода ID игрока
document.getElementById('player-id').addEventListener('input', function(e) {
    playerData.playerId = e.target.value;
    saveToLocalStorage();
});

// Обработка ручного ввода MMR
document.getElementById('manual-mmr').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        setManualMMR();
    }
});

// Обработка ввода имени героя (Enter для быстрой отправки)
document.getElementById('hero-name').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addGame('win'); // По умолчанию победа при Enter
    }
});

// Обновление предпросмотра при изменении длительности игры
document.getElementById('game-duration').addEventListener('change', function() {
    updateMmrChangePreview();
});
