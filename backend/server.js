// server.js
import { PORT } from "./src/config/env.js";
import app from "./src/app.js";

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
