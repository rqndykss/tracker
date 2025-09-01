// Загрузка данных при запуске
document.addEventListener('DOMContentLoaded', function() {
    loadStatsData();
    showStatsSection('overall');
});

// Загрузка данных статистики
function loadStatsData() {
    const savedData = localStorage.getItem('dota2TitanData');
    if (savedData) {
        const playerData = JSON.parse(savedData);
        updateAllStats(playerData);
    } else {
        showNoDataMessage();
    }
}

// Показать раздел статистики
function showStatsSection(section) {
    // Скрыть все разделы
    document.querySelectorAll('.stats-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Показать выбранный раздел
    document.getElementById(section + '-stats').classList.add('active');
    document.querySelector(`.nav-btn[onclick="showStatsSection('${section}')"]`).classList.add('active');
    
    // Обновить данные раздела
    const savedData = localStorage.getItem('dota2TitanData');
    if (savedData) {
        const playerData = JSON.parse(savedData);
        updateSectionStats(section, playerData);
    }
}

// Обновить все статистики
function updateAllStats(playerData) {
    updateOverallStats(playerData);
    updateHeroesStats(playerData);
    updateTimelineStats(playerData);
    updateAllGamesList(playerData);
}

// Обновить статистику раздела
function updateSectionStats(section, playerData) {
    switch(section) {
        case 'overall':
            updateOverallStats(playerData);
            break;
        case 'heroes':
            updateHeroesStats(playerData);
            break;
        case 'timeline':
            updateTimelineStats(playerData);
            break;
    }
}

// Общая статистика
function updateOverallStats(playerData) {
    const games = playerData.games || [];
    
    if (games.length === 0) {
        document.getElementById('overall-stats').innerHTML = `
            <div class="no-data">Нет данных для отображения статистики</div>
        `;
        return;
    }
    
    const wins = games.filter(game => game.result === 'win').length;
    const losses = games.filter(game => game.result === 'loss').length;
    const totalGames = games.length;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
    
    // Определяем текущий диапазон MMR
    let mmrRange = "Стабильный";
    let mmrMin = 15;
    let mmrMax = 25;
    
    if (totalGames < 10) {
        mmrRange = "Калибровка";
        mmrMin = 60;
        mmrMax = 150;
    } else if (totalGames < 30) {
        mmrRange = "Неопределенность";
        mmrMin = 30;
        mmrMax = 50;
    } else if (totalGames < 100) {
        mmrRange = "Обычный";
        mmrMin = 20;
        mmrMax = 35;
    } else if (totalGames < 200) {
        mmrRange = "Стабильный";
        mmrMin = 15;
        mmrMax = 25;
    } else {
        mmrRange = "Уверенный";
        mmrMin = 10;
        mmrMax = 20;
    }
    
    // Основная статистика
    document.getElementById('total-games-stats').textContent = totalGames;
    document.getElementById('total-wins-stats').textContent = wins;
    document.getElementById('total-losses-stats').textContent = losses;
    document.getElementById('win-rate-stats').textContent = winRate + '%';
    
    // Детальная статистика
    const totalMmrChange = games.reduce((sum, game) => sum + game.mmrChange, 0);
    const avgMmrChange = totalGames > 0 ? Math.round(totalMmrChange / totalGames) : 0;
    
    const totalDuration = games.reduce((sum, game) => sum + (game.duration || 0), 0);
    const avgDuration = totalGames > 0 ? Math.round(totalDuration / totalGames) : 0;
    
    // Серии побед/поражений
    const streaks = calculateStreaks(games);
    
    document.getElementById('avg-mmr-change').textContent = (avgMmrChange > 0 ? '+' : '') + avgMmrChange;
    document.getElementById('max-win-streak').textContent = streaks.maxWinStreak;
    document.getElementById('max-loss-streak').textContent = streaks.maxLossStreak;
    document.getElementById('avg-duration').textContent = avgDuration + ' мин';
    
    // Добавляем информацию о системе MMR
    const mmrSystemInfo = document.getElementById('mmr-system-info');
    if (mmrSystemInfo) {
        mmrSystemInfo.innerHTML = `
            <div class="mmr-system">
                <h4>Текущая система MMR: ${mmrRange}</h4>
                <p>Диапазон изменения: +${mmrMin}-${mmrMax} MMR за игру</p>
                <p>Всего сыграно игр: ${totalGames}</p>
            </div>
        `;
    }
    
    // График win/loss
    updateWinLossChart(wins, losses, totalGames);
}

// Расчет серий побед/поражений
function calculateStreaks(games) {
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    
    // Сортируем игры по дате (от старых к новым)
    const sortedGames = [...games].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    sortedGames.forEach(game => {
        if (game.result === 'win') {
            currentWinStreak++;
            currentLossStreak = 0;
            maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
        } else if (game.result === 'loss') {
            currentLossStreak++;
            currentWinStreak = 0;
            maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
        }
    });
    
    return { maxWinStreak, maxLossStreak };
}

// Обновить график win/loss
function updateWinLossChart(wins, losses, totalGames) {
    const winPercentage = totalGames > 0 ? (wins / totalGames) * 100 : 0;
    const lossPercentage = totalGames > 0 ? (losses / totalGames) * 100 : 0;
    
    const winBar = document.getElementById('win-bar');
    const lossBar = document.getElementById('loss-bar');
    
    if (winBar && lossBar) {
        winBar.style.width = winPercentage + '%';
        lossBar.style.width = lossPercentage + '%';
        
        winBar.querySelector('.bar-label').textContent = `Победы: ${Math.round(winPercentage)}%`;
        lossBar.querySelector('.bar-label').textContent = `Поражения: ${Math.round(lossPercentage)}%`;
    }
}

// Статистика по героям
function updateHeroesStats(playerData) {
    const games = playerData.games || [];
    const heroesContainer = document.getElementById('heroes-stats-list');
    
    if (!heroesContainer) return;
    
    if (games.length === 0) {
        heroesContainer.innerHTML = '<div class="no-heroes">Нет данных по героям</div>';
        return;
    }
    
    // Группировка по героям
    const heroStats = {};
    
    games.forEach(game => {
        if (!game.hero) return;
        
        const hero = game.hero;
        if (!heroStats[hero]) {
            heroStats[hero] = {
                wins: 0,
                losses: 0,
                total: 0,
                totalMmrChange: 0,
                totalDuration: 0
            };
        }
        
        heroStats[hero].total++;
        heroStats[hero].totalMmrChange += game.mmrChange;
        heroStats[hero].totalDuration += game.duration || 0;
        
        if (game.result === 'win') {
            heroStats[hero].wins++;
        } else {
            heroStats[hero].losses++;
        }
    });
    
    // Сортировка по количеству игр
    const sortedHeroes = Object.entries(heroStats)
        .sort(([, a], [, b]) => b.total - a.total);
    
    if (sortedHeroes.length === 0) {
        heroesContainer.innerHTML = '<div class="no-heroes">Нет данных по героям</div>';
        return;
    }
    
    heroesContainer.innerHTML = sortedHeroes.map(([hero, stats]) => {
        const winRate = stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0;
        const avgMmrChange = Math.round(stats.totalMmrChange / stats.total);
        const avgDuration = Math.round(stats.totalDuration / stats.total);
        const winRateClass = winRate >= 50 ? 'high' : 'low';
        
        return `
            <div class="hero-item ${stats.wins > stats.losses ? 'win' : 'loss'}">
                <div class="hero-name">${hero}</div>
                <div class="hero-stats">
                    <span>Игры: ${stats.total}</span>
                    <span>Победы: ${stats.wins}</span>
                    <span>Поражения: ${stats.losses}</span>
                    <span>Avg MMR: ${avgMmrChange > 0 ? '+' : ''}${avgMmrChange}</span>
                    <span>Длит.: ${avgDuration} мин</span>
                </div>
                <div class="hero-winrate ${winRateClass}">${winRate}%</div>
            </div>
        `;
    }).join('');
}

// Хронология
function updateTimelineStats(playerData) {
    const games = playerData.games || [];
    
    const timelineContainer = document.getElementById('mmr-timeline');
    const recentGamesContainer = document.getElementById('recent-games');
    
    if (!timelineContainer || !recentGamesContainer) return;
    
    if (games.length === 0) {
        timelineContainer.innerHTML = '<div class="no-data">Недостаточно данных</div>';
        recentGamesContainer.innerHTML = '<div class="no-activity">Нет активности</div>';
        return;
    }
    
    // Последние игры
    updateRecentGames(games);
    
    // Обновление графика MMR
    updateMmrTimeline(games);
}

// Обновить график MMR
function updateMmrTimeline(games) {
    // Сортируем игры по дате (от старых к новым)
    const sortedGames = [...games].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Создаем массив точек для графика
    let currentMmr = 10060; // Начальное значение MMR
    const mmrPoints = [];
    
    // Идем от первой игры к последней, накапливая изменения MMR
    for (let i = 0; i < sortedGames.length; i++) {
        currentMmr += sortedGames[i].mmrChange;
        mmrPoints.push({
            date: sortedGames[i].date,
            mmr: currentMmr
        });
    }
    
    // Здесь можно добавить отрисовку графика с помощью Chart.js или другой библиотеки
    // Для простоты покажем текстовую информацию
    const timelineContainer = document.getElementById('mmr-timeline');
    if (mmrPoints.length > 0) {
        const firstMmr = 10060; // Начальное значение
        const lastMmr = mmrPoints[mmrPoints.length - 1].mmr;
        const mmrDiff = lastMmr - firstMmr;
        
        timelineContainer.innerHTML = `
            <div class="timeline-summary">
                <div>Начальный MMR: ${firstMmr}</div>
                <div>Текущий MMR: ${lastMmr}</div>
                <div>Изменение: ${mmrDiff > 0 ? '+' : ''}${mmrDiff}</div>
                <div>Всего игр: ${games.length}</div>
            </div>
        `;
    }
}

// Обновить последние игры
function updateRecentGames(games) {
    const recentGames = games.slice(0, 10); // Последние 10 игр
    const container = document.getElementById('recent-games');
    
    if (!container) return;
    
    container.innerHTML = recentGames.map(game => {
        const date = new Date(game.date).toLocaleDateString('ru-RU');
        const time = new Date(game.date).toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        const mmrClass = game.mmrChange > 0 ? 'positive' : 'negative';
        const mmrSign = game.mmrChange > 0 ? '+' : '';
        
        return `
            <div class="activity-item ${game.result}">
                <div>
                    <strong>${game.hero || 'Неизвестный герой'}</strong>
                    <div>${date} ${time} • ${game.duration} мин</div>
                </div>
                <div class="game-mmr-change ${mmrClass}">
                    ${mmrSign}${game.mmrChange}
                </div>
            </div>
        `;
    }).join('');
}

// Смена диапазона времени
function changeTimelineRange(range) {
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Фильтрация по времени
    const savedData = localStorage.getItem('dota2TitanData');
    if (savedData) {
        const playerData = JSON.parse(savedData);
        let filteredGames = playerData.games || [];
        
        const now = new Date();
        if (range === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filteredGames = filteredGames.filter(game => new Date(game.date) >= weekAgo);
        } else if (range === 'month') {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            filteredGames = filteredGames.filter(game => new Date(game.date) >= monthAgo);
        }
        
        updateTimelineStats({ ...playerData, games: filteredGames });
    }
}

// Все игры
function updateAllGamesList(playerData) {
    const games = playerData.games || [];
    const container = document.getElementById('all-games-container');
    
    if (!container) return;
    
    if (games.length === 0) {
        container.innerHTML = '<div class="no-games">Игры не добавлены</div>';
        return;
    }
    
    // Сортируем от новых к старым
    const sortedGames = [...games].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = sortedGames.map(game => {
        const date = new Date(game.date).toLocaleDateString('ru-RU');
        const time = new Date(game.date).toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        const mmrClass = game.mmrChange > 0 ? 'positive' : 'negative';
        const mmrSign = game.mmrChange > 0 ? '+' : '';
        
        return `
            <div class="game-history-item ${game.result}">
                <div class="game-result-icon">
                    ${game.result === 'win' ? '✅' : '❌'}
                </div>
                <div class="game-history-info">
                    <div class="game-hero-name">${game.hero || 'Неизвестный герой'}</div>
                    <div class="game-details">
                        <span>${game.duration} мин</span>
                        <span>${date} ${time}</span>
                        <span>MMR: ${mmrSign}${game.mmrChange}</span>
                    </div>
                </div>
                <div class="game-mmr-change ${mmrClass}">
                    ${mmrSign}${Math.abs(game.mmrChange)}
                </div>
            </div>
        `;
    }).join('');
}

// Общая статистика
function updateOverallStats(playerData) {
    const games = playerData.games || [];
    
    if (games.length === 0) {
        document.getElementById('overall-stats').innerHTML = `
            <div class="no-data">Нет данных для отображения статистики</div>
        `;
        return;
    }
    
    const wins = games.filter(game => game.result === 'win').length;
    const losses = games.filter(game => game.result === 'loss').length;
    const totalGames = games.length;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
    
    // Определяем текущий диапазон MMR
    let mmrRange = "Обычный";
    let mmrMin = 20;
    let mmrMax = 35;
    
    if (totalGames < 10) {
        mmrRange = "Калибровка";
        mmrMin = 60;
        mmrMax = 150;
    } else if (totalGames < 30) {
        mmrRange = "Неопределенность";
        mmrMin = 30;
        mmrMax = 50;
    }
    
    // Основная статистика
    document.getElementById('total-games-stats').textContent = totalGames;
    document.getElementById('total-wins-stats').textContent = wins;
    document.getElementById('total-losses-stats').textContent = losses;
    document.getElementById('win-rate-stats').textContent = winRate + '%';
    
    // Детальная статистика
    const totalMmrChange = games.reduce((sum, game) => sum + game.mmrChange, 0);
    const avgMmrChange = totalGames > 0 ? Math.round(totalMmrChange / totalGames) : 0;
    
    const totalDuration = games.reduce((sum, game) => sum + (game.duration || 0), 0);
    const avgDuration = totalGames > 0 ? Math.round(totalDuration / totalGames) : 0;
    
    // Серии побед/поражений
    const streaks = calculateStreaks(games);
    
    document.getElementById('avg-mmr-change').textContent = (avgMmrChange > 0 ? '+' : '') + avgMmrChange;
    document.getElementById('max-win-streak').textContent = streaks.maxWinStreak;
    document.getElementById('max-loss-streak').textContent = streaks.maxLossStreak;
    document.getElementById('avg-duration').textContent = avgDuration + ' мин';
    
    // Добавляем информацию о системе MMR
    const mmrSystemInfo = document.getElementById('mmr-system-info');
    if (mmrSystemInfo) {
        mmrSystemInfo.innerHTML = `
            <div class="mmr-system">
                <h4>Текущая система MMR: ${mmrRange}</h4>
                <p>Диапазон изменения: +${mmrMin}-${mmrMax} MMR за игру</p>
                <p>Всего сыграно игр: ${totalGames}</p>
            </div>
        `;
    }
    
    // График win/loss
    updateWinLossChart(wins, losses, totalGames);
}

// Сообщение об отсутствии данных
function showNoDataMessage() {
    document.querySelectorAll('.stats-section').forEach(section => {
        section.innerHTML = '<div class="no-data">Нет данных для отображения</div>';
    });
}