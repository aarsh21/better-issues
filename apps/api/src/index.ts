import { app } from "./app";

app.listen(3002);

console.info(`better-issues api listening on http://localhost:${app.server?.port ?? 3002}`);
