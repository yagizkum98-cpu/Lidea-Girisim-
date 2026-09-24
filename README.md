# Lidea Girisim Programi 3. Donem MVP

Next.js App Router + TypeScript + Tailwind CSS + Prisma + MongoDB.

## Kurulum

```bash
npm install
cp .env.example .env
docker compose up -d
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Tarayici: http://localhost:3000

MongoDB yerelde `docker-compose.yml` ile replica set olarak calisir. Prisma MongoDB
transaction'lari icin bu gerekli; standalone Mongo kurulumunda bazi yazma islemleri
hata verebilir.

Veritabani saglik kontrolu:

```bash
curl http://localhost:3000/api/health/db
```

## Icerik

- Responsive landing page
- Hero / Program / Surec / SSS / CTA
- `/basvuru` basvuru formu
- Prisma ile MongoDB veri katmani
- Demo seed verileri
- Vercel uyumlu yapi

> Not: Bu MVP ozgun bir demo arayuzudur. Resmi 3. donem tarihleri, logolar,
> mentorlar ve program kosullari dogrulanarak eklenmelidir.
