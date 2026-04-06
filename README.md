# NhomCanChienThan

Bo khung du an duoc tao tu file mo ta cong nghe va cau truc.

## Cong nghe

- Frontend: React 19, Vite 5, React Router 7, Axios, Tailwind CSS 3, Socket.IO Client
- Backend: Express, MongoDB + Mongoose, Socket.IO, JWT

## Cau truc

```
.
|- frontend/
|- backend/
|- file.md
`- package.json
```

## Cach chay

1. Cai dependency o thu muc goc:

```bash
npm install
```

2. Tao file `backend/.env` tu `backend/.env.example` neu can cau hinh.

3. Chay dong thoi frontend va backend:

```bash
npm run dev
```

4. Neu chi muon chay rieng tung phan:

```bash
npm run dev:frontend
npm run dev:backend
```

## Bien moi truong backend

- `PORT`: Cong backend, mac dinh `5000`
- `CLIENT_URL`: Dia chi frontend, mac dinh `http://localhost:5173`
- `MONGO_URI`: Chuoi ket noi MongoDB
- `JWT_SECRET`: Khoa ky JWT
- `SMTP_SERVICE`: Dich vu SMTP, voi Gmail dat la `gmail`
- `SMTP_HOST`: Host SMTP, Gmail la `smtp.gmail.com`
- `SMTP_PORT`: Cong SMTP, thuong la `587`
- `SMTP_SECURE`: `false` voi cong `587`, `true` voi cong `465`
- `SMTP_USER`: Dia chi Gmail dung de gui OTP
- `SMTP_PASS`: App Password 16 ky tu cua Gmail, khong dung mat khau dang nhap Gmail thuong
- `SMTP_FROM_NAME`: Ten hien thi nguoi gui email OTP
- `SMTP_FROM_EMAIL`: Email hien thi nguoi gui, thuong giong `SMTP_USER`

## Ghi chu

- Backend van co the khoi dong neu chua cau hinh MongoDB; ket noi database se duoc bo qua va in canh bao.
- Frontend da co router, axios service, auth context va socket hook de tiep tuc phat trien.
- Neu gui OTP bang Gmail, can bat xac minh 2 buoc va tao App Password trong Google Account de gan vao `SMTP_PASS`.
