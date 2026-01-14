// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// API URL
const API_URL = window.location.origin;

// Получение данных пользователя из Telegram
const user = tg.initDataUnsafe?.user || {};
const telegramId = user.id;
const username = user.username || '';
const firstName = user.first_name || '';

// Установка цвета темы
tg.setHeaderColor('#3390ec');
tg.setBackgroundColor('#f8f9fa');

// Управление табами
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        
        // Удаляем active класс у всех табов и контента
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
        
        // Добавляем active класс к выбранному табу и контенту
        tab.classList.add('active');
        document.getElementById(tabName).classList.add('active');
        
        // Загружаем данные для активного таба
        loadTabData(tabName);
    });
});

// Загрузка данных для таба
function loadTabData(tabName) {
    switch(tabName) {
        case 'home':
            loadCottageInfo();
            break;
        case 'booking':
            loadCalendar();
            break;
        case 'reviews':
            loadReviews();
            break;
        case 'my-bookings':
            loadMyBookings();
            break;
    }
}

// Загрузка информации о коттедже
async function loadCottageInfo() {
    try {
        const response = await fetch(`${API_URL}/api/cottage/info`);
        const data = await response.json();
        
        document.getElementById('cottage-details').innerHTML = `
            <p><strong>${data.name}</strong></p>
            <p style="margin-top: 10px; color: #6c757d;">${data.description}</p>
            <div style="margin-top: 15px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                <div><strong>Комнат:</strong> ${data.rooms}</div>
                <div><strong>Спальных мест:</strong> ${data.beds}</div>
                <div><strong>Площадь:</strong> ${data.area} м²</div>
                <div><strong>Цена:</strong> ${data.price} ${data.currency}/ночь</div>
            </div>
        `;
        
        const amenitiesHtml = data.amenities.map(amenity => 
            `<div class="amenity-item">${amenity}</div>`
        ).join('');
        document.getElementById('amenities-list').innerHTML = 
            `<div class="amenities-grid">${amenitiesHtml}</div>`;
    } catch (error) {
        console.error('Ошибка загрузки информации:', error);
    }
}

// Загрузка календаря
async function loadCalendar() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    try {
        const response = await fetch(`${API_URL}/api/availability?month=${currentMonth}&year=${currentYear}`);
        const data = await response.json();
        const blockedDates = new Set(data.blockedDates);
        
        renderCalendar(currentYear, currentMonth, blockedDates);
        
        // Установка минимальной даты для формы
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('check-in').min = tomorrow.toISOString().split('T')[0];
        document.getElementById('check-out').min = tomorrow.toISOString().split('T')[0];
        
        // Обновление минимальной даты выезда при выборе даты заезда
        document.getElementById('check-in').addEventListener('change', function() {
            const checkIn = new Date(this.value);
            checkIn.setDate(checkIn.getDate() + 1);
            document.getElementById('check-out').min = checkIn.toISOString().split('T')[0];
        });
    } catch (error) {
        console.error('Ошибка загрузки календаря:', error);
    }
}

// Рендеринг календаря
function renderCalendar(year, month, blockedDates) {
    const calendarEl = document.getElementById('calendar');
    const today = new Date();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Дни недели
    const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    let calendarHtml = '';
    
    // Заголовки дней недели
    weekDays.forEach(day => {
        calendarHtml += `<div style="text-align: center; font-weight: 600; padding: 8px; font-size: 12px;">${day}</div>`;
    });
    
    // Пустые ячейки до первого дня месяца
    for (let i = 0; i < startingDayOfWeek - 1; i++) {
        calendarHtml += `<div class="calendar-day other-month"></div>`;
    }
    
    // Дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const date = new Date(year, month, day);
        const isToday = date.toDateString() === today.toDateString();
        const isBlocked = blockedDates.has(dateStr) || date < today;
        
        let classes = 'calendar-day';
        if (isBlocked) {
            classes += ' booked';
        } else {
            classes += ' available';
        }
        if (isToday) {
            classes += ' today';
        }
        
        calendarHtml += `<div class="${classes}" data-date="${dateStr}">${day}</div>`;
    }
    
    calendarEl.innerHTML = calendarHtml;
}

// Отправка бронирования
document.getElementById('submit-booking').addEventListener('click', async function() {
    const checkIn = document.getElementById('check-in').value;
    const checkOut = document.getElementById('check-out').value;
    const guests = parseInt(document.getElementById('guests').value);
    const messageEl = document.getElementById('booking-message');
    
    if (!checkIn || !checkOut) {
        messageEl.className = 'message-error';
        messageEl.textContent = 'Пожалуйста, выберите даты заезда и выезда';
        return;
    }
    
    if (new Date(checkOut) <= new Date(checkIn)) {
        messageEl.className = 'message-error';
        messageEl.textContent = 'Дата выезда должна быть позже даты заезда';
        return;
    }
    
    this.disabled = true;
    this.textContent = 'Отправка...';
    
    try {
        const response = await fetch(`${API_URL}/api/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                telegramId,
                checkIn,
                checkOut,
                guests,
                username,
                firstName
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            messageEl.className = 'message-success';
            messageEl.textContent = data.message;
            
            // Очистка формы
            document.getElementById('check-in').value = '';
            document.getElementById('check-out').value = '';
            document.getElementById('guests').value = '2';
            
            // Обновление календаря
            loadCalendar();
        } else {
            messageEl.className = 'message-error';
            messageEl.textContent = data.error || 'Ошибка при создании бронирования';
        }
    } catch (error) {
        messageEl.className = 'message-error';
        messageEl.textContent = 'Ошибка соединения. Попробуйте позже.';
    } finally {
        this.disabled = false;
        this.textContent = 'Забронировать';
    }
});

// Управление рейтингом
let selectedRating = 0;
document.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', function() {
        selectedRating = parseInt(this.dataset.rating);
        updateStars();
        document.getElementById('selected-rating').textContent = selectedRating;
    });
});

function updateStars() {
    document.querySelectorAll('.star').forEach((star, index) => {
        if (index < selectedRating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

// Отправка отзыва
document.getElementById('submit-review').addEventListener('click', async function() {
    const comment = document.getElementById('review-comment').value;
    
    if (selectedRating === 0) {
        tg.showAlert('Пожалуйста, выберите оценку');
        return;
    }
    
    this.disabled = true;
    this.textContent = 'Отправка...';
    
    try {
        const response = await fetch(`${API_URL}/api/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                telegramId,
                rating: selectedRating,
                comment,
                username,
                firstName
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            tg.showAlert(data.message);
            
            // Очистка формы
            selectedRating = 0;
            updateStars();
            document.getElementById('selected-rating').textContent = '0';
            document.getElementById('review-comment').value = '';
            
            // Обновление отзывов
            loadReviews();
        } else {
            tg.showAlert(data.error || 'Ошибка при отправке отзыва');
        }
    } catch (error) {
        tg.showAlert('Ошибка соединения. Попробуйте позже.');
    } finally {
        this.disabled = false;
        this.textContent = 'Отправить отзыв';
    }
});

// Загрузка отзывов
async function loadReviews() {
    try {
        // Загрузка статистики
        const statsResponse = await fetch(`${API_URL}/api/reviews/stats`);
        const stats = await statsResponse.json();
        
        const statsHtml = `
            <div class="average-rating">${stats.average ? stats.average.toFixed(1) : '0.0'}</div>
            <div class="rating-breakdown">
                <div class="rating-bar">
                    <span class="rating-bar-label">5 ⭐</span>
                    <div class="rating-bar-fill">
                        <div class="rating-bar-progress" style="width: ${stats.total > 0 ? (stats.five_star / stats.total * 100) : 0}%"></div>
                    </div>
                    <span>${stats.five_star || 0}</span>
                </div>
                <div class="rating-bar">
                    <span class="rating-bar-label">4 ⭐</span>
                    <div class="rating-bar-fill">
                        <div class="rating-bar-progress" style="width: ${stats.total > 0 ? (stats.four_star / stats.total * 100) : 0}%"></div>
                    </div>
                    <span>${stats.four_star || 0}</span>
                </div>
                <div class="rating-bar">
                    <span class="rating-bar-label">3 ⭐</span>
                    <div class="rating-bar-fill">
                        <div class="rating-bar-progress" style="width: ${stats.total > 0 ? (stats.three_star / stats.total * 100) : 0}%"></div>
                    </div>
                    <span>${stats.three_star || 0}</span>
                </div>
                <div class="rating-bar">
                    <span class="rating-bar-label">2 ⭐</span>
                    <div class="rating-bar-fill">
                        <div class="rating-bar-progress" style="width: ${stats.total > 0 ? (stats.two_star / stats.total * 100) : 0}%"></div>
                    </div>
                    <span>${stats.two_star || 0}</span>
                </div>
                <div class="rating-bar">
                    <span class="rating-bar-label">1 ⭐</span>
                    <div class="rating-bar-fill">
                        <div class="rating-bar-progress" style="width: ${stats.total > 0 ? (stats.one_star / stats.total * 100) : 0}%"></div>
                    </div>
                    <span>${stats.one_star || 0}</span>
                </div>
            </div>
        `;
        
        document.querySelector('.stats-content').innerHTML = statsHtml;
        
        // Загрузка списка отзывов
        const reviewsResponse = await fetch(`${API_URL}/api/reviews`);
        const reviews = await reviewsResponse.json();
        
        if (reviews.length === 0) {
            document.getElementById('reviews-list').innerHTML = '<p style="text-align: center; color: #6c757d;">Пока нет отзывов</p>';
            return;
        }
        
        const reviewsHtml = reviews.map(review => {
            const stars = '⭐'.repeat(review.rating);
            const date = new Date(review.created_at).toLocaleDateString('ru-RU');
            const author = review.first_name || review.username || 'Аноним';
            
            return `
                <div class="review-item">
                    <div class="review-header">
                        <span class="review-author">${author}</span>
                        <span class="review-rating">${stars}</span>
                    </div>
                    ${review.comment ? `<div class="review-comment">${review.comment}</div>` : ''}
                    <div class="review-date">${date}</div>
                </div>
            `;
        }).join('');
        
        document.getElementById('reviews-list').innerHTML = reviewsHtml;
    } catch (error) {
        console.error('Ошибка загрузки отзывов:', error);
        document.getElementById('reviews-list').innerHTML = '<p style="text-align: center; color: #f00;">Ошибка загрузки отзывов</p>';
    }
}

// Загрузка моих бронирований
async function loadMyBookings() {
    if (!telegramId) {
        document.getElementById('my-bookings-list').innerHTML = '<p style="text-align: center; color: #6c757d;">Войдите через Telegram</p>';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/bookings/${telegramId}`);
        const bookings = await response.json();
        
        if (bookings.length === 0) {
            document.getElementById('my-bookings-list').innerHTML = '<p style="text-align: center; color: #6c757d;">У вас пока нет бронирований</p>';
            return;
        }
        
        const bookingsHtml = bookings.map(booking => {
            const statusText = {
                'pending': 'Ожидает подтверждения',
                'confirmed': 'Подтверждено',
                'cancelled': 'Отменено'
            };
            
            return `
                <div class="booking-item">
                    <div class="booking-dates">${formatDate(booking.check_in)} - ${formatDate(booking.check_out)}</div>
                    <div class="booking-info">
                        <span>Гостей: ${booking.guests}</span>
                        <span class="booking-status ${booking.status}">${statusText[booking.status] || booking.status}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        document.getElementById('my-bookings-list').innerHTML = bookingsHtml;
    } catch (error) {
        console.error('Ошибка загрузки бронирований:', error);
        document.getElementById('my-bookings-list').innerHTML = '<p style="text-align: center; color: #f00;">Ошибка загрузки бронирований</p>';
    }
}

// Форматирование даты
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

// Загрузка данных при открытии приложения
loadTabData('home');
