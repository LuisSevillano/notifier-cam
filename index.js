import fetch from 'node-fetch';
import { promises as fs } from 'fs';
import * as cheerio from 'cheerio';

const URL = 'https://www.comunidad.madrid/servicios/salud/facultativo-especialista-microbiologia-parasitologia-2021';

const lastDateFile = './lastDate.json';

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID_1 = process.env.TELEGRAM_CHAT_ID_1;
const TELEGRAM_CHAT_ID_2 = process.env.TELEGRAM_CHAT_ID_2;

const readLastDate = async () => {
  try {
    const data = await fs.readFile(lastDateFile, 'utf-8');
    return JSON.parse(data).latest;
  } catch (err) {
    return null;
  }
};

const saveLastDate = async (date) => {
  const data = JSON.stringify({ latest: date }, null, 2);
  await fs.writeFile(lastDateFile, data);
};

const sendTelegramNotification = async (message, TELEGRAM_CHAT_ID) => {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  const payload = {
    chat_id: TELEGRAM_CHAT_ID,
    text: message,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log('Notification sent to Telegram.');
    } else {
      console.error('Error sending the notification:', await response.text());
      process.exit(1);
    }
  } catch (err) {
    console.error('Connection error with Telegram:', err);
  }
};

const scrapeWebsite = async () => {
  try {
    const response = await fetch(URL);
    const html = await response.text();

    const $ = cheerio.load(html);

    const newDate = $('#text-link-parrafo > div > div > div > p:nth-child(1) strong').text().trim();

    if (!newDate) {
      console.error('Could not find a date on the page.');
      return;
    }

    console.log('Extracted date:', newDate);

    const lastDate = await readLastDate();

    if (newDate !== lastDate) {
      await sendTelegramNotification(
        `Facultativo Especialista en Microbiología y Parasitología 2021 | Se ha detectado una nueva entrada: ${newDate}\nhttps://www.comunidad.madrid/servicios/salud/facultativo-especialista-microbiologia-parasitologia-2021`,
        TELEGRAM_CHAT_ID_1);
      await sendTelegramNotification(
        `Facultativo Especialista en Microbiología y Parasitología 2021 | Se ha detectado una nueva entrada: ${newDate}\nhttps://www.comunidad.madrid/servicios/salud/facultativo-especialista-microbiologia-parasitologia-2021`,
        TELEGRAM_CHAT_ID_2);

      await saveLastDate(newDate);
    } else {
      console.log('The date has not changed.');
    }
  } catch (err) {
    console.error('Error scraping the website:', err);
  }
};

// Run the scraper
scrapeWebsite();
