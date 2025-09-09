import http from 'http';
import dns  from 'dns';

// ---------- 1. Конфигурация ----------
// Домены → жёсткий IP (переопределение)
const STATIC_MAP = new Map([
  // вернет www.ru
  ['example.com',   '31.177.80.70'],
]);

// Домены, которые резолвим на 8.8.8.8
const CUSTOM_DOMAINS = new Set(['example.org']);

// Кастомный резолвер
const customResolver = new dns.Resolver();
customResolver.setServers(['8.8.8.8']);

// ---------- 2. lookup-функция ----------
const customLookup = (hostname, opts, cb) => {
  // Уровень 1: жёсткий IP
  if (STATIC_MAP.has(hostname)) {
    const ip = STATIC_MAP.get(hostname);
    return process.nextTick(() =>
      cb(null, [{ address: ip, family: 4 }])
    );
  }

  // Уровень 2: кастомный DNS
  if (CUSTOM_DOMAINS.has(hostname)) {
    return customResolver.resolve4(hostname, (err, arr) => {
      if (err) return cb(err);
      cb(null, arr.map(ip => ({ address: ip, family: 4 })));
    });
  }

  // Уровень 3: системный резолвер
  return dns.lookup(hostname, opts, cb);
};

// ---------- 3. Подменяем глобальный агент ----------
http.globalAgent.options = http.globalAgent.options || {};
http.globalAgent.options.lookup = customLookup;


// ..... Тут идет много кода основной программы

// ---------- 4. Проверка ----------
http.get('http://example.com',  res => {console.log('example.com  ->', res.statusCode); res.resume();});
http.get('http://example.org',  res => {console.log('example.org  ->', res.statusCode); res.resume();});
http.get('http://kremlin.ru',   res => {console.log('kremlin.ru   ->', res.statusCode); res.resume();});
