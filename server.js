const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ⚠️ ЗАМЕНИ НА СВОИ ДАННЫЕ
const BOT_TOKEN = '8825122842:AAHotijJD7aFU_q8DimYY9nnPv2WFBogBv8';
const CHAT_ID = '860736174';

const bot = new TelegramBot(BOT_TOKEN, { polling: false });

// Хранилище записей (пока в памяти)
// Структура: { "2026-10-05": [ {name, phone, time} ] }
let bookings = {};

// Принимаем новую запись с сайта
app.post('/api/booking', (req, res) => {
    const { name, phone, time, date } = req.body;

    if (!bookings[date]) bookings[date] = [];
    bookings[date].push({ name, phone, time });

    const message = `
🆕 <b>Новая запись!</b>

👤 Клиент: ${name}
📞 Телефон: ${phone || 'не указан'}
📅 Дата: ${date}
🕐 Время: ${time}
    `;

    bot.sendMessage(CHAT_ID, message, { parse_mode: 'HTML' })
        .then(() => res.json({ success: true }))
        .catch(err => {
            console.error(err);
            res.status(500).json({ success: false });
        });
});

// Отдаём записи на конкретную дату (нужно для ежедневного напоминания)
app.get('/api/bookings/:date', (req, res) => {
    const dateStr = req.params.date;
    res.json({ bookings: bookings[dateStr] || [] });
});

// Простой тест — чтобы проверить, что сервер жив
app.get('/', (req, res) => {
    res.send('Сервер работает!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
