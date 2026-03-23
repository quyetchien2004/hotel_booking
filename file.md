## 2. Công Nghệ Sử Dụng

### Frontend

| Công nghệ        | Phiên bản | Mục đích               |
| ---------------- | --------- | ---------------------- |
| React            | 19.x      | UI Framework           |
| Vite             | 5.x       | Build tool, dev server |
| React Router     | 7.x       | Routing                |
| Axios            | 1.x       | HTTP Client            |
| Tailwind CSS     | 3.x       | Styling                |
| Socket.io-client | 4.x       | Realtime communication |

### Backend

| Công nghệ          | Mục đích        |
| ------------------ | --------------- |
| Express.js         | Web framework   |
| MongoDB + Mongoose | Database        |
| Socket.io          | Realtime events |
| JWT                | Authentication  |

---

## 3. Cấu Trúc Project

```

├── frontend/                     # React 19 Frontend
│   ├── src/
│   │   ├── components/           # UI Components
│   │   │   ├──
│   │   │   ├──
│   │   │   ├──
│   │   │   ├──
│   │   │   ├──
│   │   │   └──
│   │   │
│   │   ├── pages/               # Page Components
│   │   │   ├──
│   │   │   ├──
│   │   │   ├──
│   │   │   ├──
│   │   │   ├──
│   │   │   └──
│   │   │
│   │   ├── services/            # API Services
│   │   │   ├──
│   │   │   ├──
│   │   │   └──
│   │   │
│   │   ├── contexts/           # React Contexts
│   │   │   └──
│   │   │
│   │   ├── hooks/              # Custom Hooks
│   │   │   └──
│   │   │
│   │   ├── App.jsx             # ✅ Main app with routing
│   │   ├── main.jsx            # ✅ Entry point
│   │   └── index.css          # ✅ Global styles
│   │
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── backend/                      # Node.js Backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── middlewares/
│   │   ├── services/
│   │   ├── events/
│   │   ├── workers/
│   │   ├── validators/
│   │   ├── config/
│   │   └── utils/
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   └── react-lecture.md         # 📚 Bài giảng React 19
│
└── README.md
```

---
