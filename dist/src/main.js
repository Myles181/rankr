"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const session = require("express-session");
const express = require("express");
const path_1 = require("path");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:4000',
        credentials: true,
    });
    app.use(session({
        secret: process.env.SESSION_SECRET || 'rankr_dev_secret',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false,
            maxAge: 24 * 60 * 60 * 1000,
        },
    }));
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.use(express.static((0, path_1.join)(__dirname, '..')));
    app.use('/fan/dashboard', (_req, res) => res.sendFile((0, path_1.join)(__dirname, '..', '..', 'fan-dashboard.html')));
    app.use('/artist/dashboard', (_req, res) => res.sendFile((0, path_1.join)(__dirname, '..', '..', 'artist-dashboard.html')));
    app.use('/artist/verify', (_req, res) => res.sendFile((0, path_1.join)(__dirname, '..', '..', 'index.html')));
    app.use('/auth-error', (_req, res) => res.sendFile((0, path_1.join)(__dirname, '..', '..', 'index.html')));
    const port = process.env.PORT || 4000;
    await app.listen(port);
    console.log(`\nRankr backend running on http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map